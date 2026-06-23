import { spawn } from "node:child_process";

const PORT = Number(process.env.REPLYGUY_TEST_PORT || 3310);
const BASE_URL = `http://127.0.0.1:${PORT}`;

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "Regression runner requires OPENAI_API_KEY in the shell environment. " +
      "It intentionally ignores .env.local so stale local secrets do not mask production behavior.",
  );
}

const scenarios = [
  {
    id: "polish_email_preserves_opening",
    description: "Polish mode should preserve a preferred email opening and avoid invented details.",
    request: {
      subject: "Re: Compatibility check",
      message: "Customer originally asked about compatibility and is waiting for a reply.",
      composeMode: "polish",
      replyMode: "careful",
      medium: "email",
      currentDraft: [
        "Thank you for your response.",
        "",
        "I am checking this now and will get back to you soon.",
      ].join("\n"),
      threadMemory: {
        latestCustomerAsk: "Can you confirm whether this part is compatible with my gateway?",
        recentCustomerContext: [],
        recentTeamReplies: [],
        openQuestion: "Can you confirm compatibility?",
        constraints: [],
      },
      productTags: [],
      revisionFeedback: "Make this a little warmer, but do not add new information.",
      allowFallback: false,
    },
    assertions: [
      mustInclude("Thank you for your response"),
      mustNotInclude("24 to 48 hours"),
      mustNotInclude("carrier"),
      mustNotInclude("screenshots"),
      mustNotInclude("tracking"),
    ],
  },
  {
    id: "polish_sms_stays_short_form",
    description: "SMS polish should avoid email-style sign-offs and keep the original meaning.",
    request: {
      subject: "",
      message: "Customer wants a quick update over text.",
      composeMode: "polish",
      replyMode: "fast",
      medium: "sms",
      currentDraft: "Thanks for the follow-up. I am checking now and will update you soon.",
      threadMemory: {
        latestCustomerAsk: "Any update yet?",
        recentCustomerContext: [],
        recentTeamReplies: [],
        openQuestion: "Any update yet?",
        constraints: [],
      },
      productTags: [],
      revisionFeedback: "Keep this short and text-friendly.",
      allowFallback: false,
    },
    assertions: [
      mustInclude("Thanks for the follow-up"),
      mustNotInclude("Best,"),
      mustNotInclude("Sincerely"),
      mustNotInclude("Thank you for reaching out to us"),
    ],
  },
  {
    id: "reply_email_avoids_em_dash",
    description: "Email reply mode should avoid em dashes in output.",
    request: {
      subject: "Compatibility before ordering",
      message: "Hi, I’m still unsure whether this antenna will help my setup — I’m on T-Mobile home internet in a detached office — and I’d like to know if there’s anything else I should check before placing the order.",
      composeMode: "reply",
      replyMode: "careful",
      medium: "email",
      threadMemory: {
        latestCustomerAsk: "Can you confirm whether this antenna is the right fit for my detached office setup?",
        recentCustomerContext: [],
        recentTeamReplies: [],
        openQuestion: "Will this antenna help my setup?",
        constraints: [],
      },
      productTags: [],
      revisionFeedback: "",
      currentDraft: "",
      allowFallback: false,
    },
    assertions: [
      mustNotInclude("—"),
    ],
  },
];

const server = spawn(process.execPath, ["server/index.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(PORT),
    REPLYGUY_REQUIRE_PROCESS_OPENAI_KEY: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

try {
  await waitForHealth();
  const results = [];

  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);
  }

  printSummary(results);
  process.exitCode = results.every((result) => result.passed) ? 0 : 1;
} finally {
  server.kill();
}

async function waitForHealth() {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }
    await sleep(500);
  }

  throw new Error(`ReplyGuy server did not become healthy on ${BASE_URL}.\n\nServer output:\n${serverOutput}`);
}

async function runScenario(scenario) {
  const response = await fetch(`${BASE_URL}/api/support-lab/draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scenario.request),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.draftReply) {
    return {
      id: scenario.id,
      description: scenario.description,
      passed: false,
      failures: [`Request failed: ${payload?.detail || payload?.error || response.statusText}`],
      output: payload?.draftReply || "",
    };
  }

  const failures = scenario.assertions
    .map((assertion) => assertion(payload.draftReply))
    .filter(Boolean);

  return {
    id: scenario.id,
    description: scenario.description,
    passed: failures.length === 0,
    failures,
    output: payload.draftReply,
  };
}

function mustInclude(value) {
  return (output) => output.includes(value) ? "" : `Expected output to include: ${value}`;
}

function mustNotInclude(value) {
  return (output) => output.includes(value) ? `Expected output to avoid: ${value}` : "";
}

function printSummary(results) {
  for (const result of results) {
    console.log(`\n[${result.passed ? "PASS" : "FAIL"}] ${result.id}`);
    console.log(result.description);
    if (result.failures.length) {
      for (const failure of result.failures) {
        console.log(`- ${failure}`);
      }
    }
    console.log("Output:");
    console.log(result.output);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
