# Front Plugin Deploy

This repo has a dedicated Front sidebar plugin entry page at `/front-plugin.html`.

## What Gets Hosted

- Dashboard: `/`
- Front plugin: `/front-plugin.html`
- Backend API: `/api/*`

The Node server serves the built Vite app from `dist/` in production, so one web service hosts both frontend and backend.

## Host Requirements

Any host will work as long as it can:

- deploy a Node app from this repo
- run `npm install && npm run build`
- start the server with `npm start`
- expose a public HTTPS URL

Front sidebar plugins need that public HTTPS URL.

## Required Environment Variables

Add these on your hosting provider:

- `OPENAI_API_KEY`
- `OPENAI_REPLY_MODEL=gpt-5.4`
- `FRONT_API_TOKEN`
- `FRONT_BASE_URL=https://api2.frontapp.com`
- `FRONT_PIPELINE_INBOXES=WF Help,WI - SMS Support,AMZ SMS,AMZ UK`

Optional:

- `PORT`
  Most hosts provide this automatically.

## Railway Setup

Recommended host for this project: Railway.

### 1. Create the service

- Open Railway.
- Create a new project.
- Choose `Deploy from GitHub repo`.
- Select `Ianwaveform/ReplyGuy`.

### 2. Configure the service

If Railway does not auto-detect the commands, use:

- Build command: `npm install && npm run build`
- Start command: `npm start`

### 3. Add environment variables

Add the required variables listed above in the Railway service settings.

### 4. Deploy

After deploy, Railway will give you a public URL such as:

- `https://replyguy-production.up.railway.app`

Your Front plugin URL will be:

- `https://replyguy-production.up.railway.app/front-plugin.html`

## Render Setup

There is also a [render.yaml](/C:/Users/ianfo/Documents/ReplyGuy/render.yaml) file in the repo if you ever want a Render fallback, but Railway is the current target.

## Front App Setup

In Front:

1. Go to `Settings`
2. Open `Company`
3. Open `Developers`
4. Create or open your app
5. Add a `Sidebar Plugin`
6. Set the plugin URL to your hosted `/front-plugin.html`

## Current Plugin Behavior

The plugin currently:

- reads the selected single conversation
- loads the latest inbound customer message
- generates a ReplyGuy reply draft from that thread
- copies the draft
- inserts the draft into Front
- saves training notes against the generated draft

## Notes

- Front requires a public HTTPS URL for the plugin
- local `127.0.0.1` URLs are useful for development, but not for normal plugin use
- if OpenAI quota is unavailable, the draft endpoint falls back to the local draft logic
