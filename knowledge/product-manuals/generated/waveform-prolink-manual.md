---
title: "Waveform ProLink Manual"
source_pdf: "pdf/Waveform ProLink Manual (WF-PRL-MANUAL) v1.0.3.pdf"
product_tags: ["ProLink"]
keywords: ["ProLink", "signal scanner", "installation", "troubleshooting", "app"]
---

# Waveform ProLink Manual

Directional Outdoor 5G Modem
ProLink
Scan this QR code to watch the
setup videos, and...
Connect to our team of dedicated Signal
Specialists - They are eager to help!
Get your free Virtual Site Survey - including
a map of cell towers and where to mount
your ProLink.
View a digital copy of this manual.
BEFORE YOU START!
setup.wf/ProLink
powered by

-- 1 of 32 --

ProLink
What’s in the Box
Cables and Accessories
PoE Injector & Power
Supply
B A G
Ethernet Window Entry Cable
(Manual included in bag)
4x
3x Ethernet Cables
(Includes a black 4.6 ft (1.4 m) cable, a black 50 ft (15 m) cable,
and a white 50 ft (15 m) cable)
B A G S
Wall Bracket w/
Assembly Hardware
2x
2x
2x
B AG S
2
B OX
UltraPole - Optional
(Manual included in box)
4x 4x
5x 5x
4x 1x

-- 2 of 32 --

Heads up: It can take a bit of patience to set up ProLink and get the fastest speeds available.
We’d be surprised if you saw better data speeds immediately upon connecting ProLink. Be
prepared to spend an hour or two finding the best position & aiming it.
This manual is based on decades of experience, supporting hundreds of thousands of
customers like you. We’ve poured our hearts and souls into it, to make it as helpful as possible.
We promise you’ll be glad if you read it from start to finish before you get started. It’ll help
you save time, avoid common pitfalls, and ensure your system works as well as possible.
Who We Are
Hi! We’re Waveform. We’ve been around since 2007, and while we’ve grown a bunch since
then, we’re still a small team. Now, we’ve partnered with Elsys to develop the best outdoor 5G
modem there is.
The four of us pictured below lead support and product development. Feel free to reach out
to us at any time; our emails are all just our first names @waveform.com
Stuck? Have Questions? Please: Contact Us!
We’re a small team, but we really care about helping you get the best results.
If you’re having issues, please reach out. Sometimes a small tweak can make all the difference.
Even if everything goes smoothly, let us know how your system is performing!
And we love getting feedback: if you think of a way we could make ProLink, our accessories,
the install process, or this manual better — let us know!
Simply visit setup.wf/ProLink to connect with our team of dedicated Signal Specialists, and
access a bunch of helpful resources!
Install Manuals, Who Needs ‘Em?
Sina (CEO) Marcus (Product) Ian (Support) Austin (Product)
3

-- 3 of 32 --

It’s critical that you have at least 1 bar of usable 4G LTE or 5G signal outside or on the roof of
the building where you’re installing your ProLink — specifically for the carrier it will connect to.
What Do We Mean by “Usable”?
When using your ProLink — or any device on the same carrier, such as a phone, gateway, or
router — a usable signal means you should be able to complete a data speed test, regardless
of the actual speed. Simply connect to your cellular device’s Wi-Fi or use your phone’s cellular
connection and visit speedtest.net to run a quick speed test.
However, if there’s no usable signal outside your building to begin with, your ProLink may
not be able to establish a reliable connection. You can certainly still give it a shot, but the
results may fall short of your expectations.
Carrier Compatibility
ProLink is certified on, and compatible with, all major U.S. carriers, including T-Mobile®, Verizon®,
and AT&T® and supports nearly all 4G LTE and low- to mid-band 5G bands used in the U.S.:
Before You Start
00
ProLink uses multiple antennas to enable a MIMO (Multiple Input, Multiple Output) connection
between it and the cell tower — supporting 4x4 MIMO downlink across many 5G and LTE bands,
and 2x2 MIMO uplink on select 5G bands. It features a peak antenna gain of 10.0 dBi and
supports up to 5x carrier aggregation, with a maximum aggregated bandwidth of 100 MHz.
Powered by the Qualcomm SDx62 modem, ProLink can achieve download speeds up to
3.47 Gbps and upload speeds up to 900 Mbps.
All supported 4G (LTE) Bands:
B2, B4, B5, B12, B13, B17, B25, B26,
B30, B41, B48, B66, B71
All supported 5G (NR) Bands:
• Standalone (SA): n2, n5, n14, n30, n38, n48, n66, n77
• Non-Standalone (NSA): n2, n5, n25, n30, n41, n66, n71, n77
B2/n2, B4, B5/n5, B12, B17, B29, B30, B46, B66/n66, n77
B2/n2, B4, B5/n5, B13, B46, B48/n48, B66/n66, n77
B2, B4, B5, B12, B25, B26, B41/n41, B46, B66, B71/n71, n77
4

-- 4 of 32 --

Here’s what you need to know:
ProLink works with most 4G LTE and 5G plans, but it’s compatibility depends on your specific
data plan — not just your carrier. Some plans restrict the usage of third-party hardware and/or
have limitations for transferring SIMs.
If you have any questions about whether your data plan or SIM card supports third-party
hardware like ProLink, please reach out to us.
Don’t have a data plan yet? You can use ProLink’s “Blind Search” feature to figure out which
carriers are best for your location. (See page 23 for details.)
What Performance Should You Expect?
In short: It’s hard to say. ProLink’s directional antennas & Qualcomm SDx62 modem support
download speeds of up to 3.47 Gbps and upload speeds of 900 Mbps, but the most limiting
factor for your data speeds will be your local cell signal, rather than ProLink’s hardware.
If you’re already using an indoor home internet gateway from a carrier, most people see
increases in data speeds between 50% and 200% — but some people may only see 10%.
Despite all the science, wireless signals often work in strange and magical ways.
One thing is for sure, the more positions and directions you test ProLink, the more likely
you are to see a big increase in data speeds. If you’ve gone through this manual and aimed
ProLink as we suggest, but you’re still not seeing much improvement, please reach out to us
for help. We can usually find ways to optimize your setup for even better speeds.
AT&T - All plans with physical SIMs work great. Just move the SIM into ProLink & go!
AT&T Home Internet: Fully compatible.
AT&T Business Internet: Fully compatible.
a
a
Verizon - Home Internet uses eSIMs which aren’t transferable, but data plans with physical SIM cards (e.g.
business or hotspot plans) work great!
Verizon Home and Business 5G Internet: Use eSIMs and can’t currently be moved to ProLink.
Other Verizon data plans (with a physical SIM): Fully compatible. a
r
T-Mobile - Business Internet works great. Home Internet isn’t currently approved for third-party hardware.
T-Mobile Business Internet: Fully compatible. SIM cards can be moved into ProLink with no issues.
T-Mobile Home Internet: SIMs are locked to the IMEI of the T-Mobile-provided Home Internet gateway.
For ProLink to work, they’d have to explicitly approve its IMEI — but they currently do not offer this support.
Tip: If you’re considering or currently on T-Mobile Home Internet, it’s generally pretty easy to switch to a
T-Mobile Business Internet plan, which enables you to move your SIM into ProLink.
a

 !
5

-- 5 of 32 --

0 Scan this QR code to get your virtual site survey and connect to
our team of signal specialists.
1 Read this manual — Ideally from start to finish, so that you
understand the whole installation process before you begin.
2 Prepare your “Test Setup” (Page 7) — Before making any holes in your roof or walls,
you’ll connect your system in the “test setup”, to make finding the best position for your
ProLink as easy as possible.
2 Find the best position and direction for your ProLink (Pages 12-13) — This step is the
most time-consuming, but it’s worth the effort and has a huge impact on your system’s
performance. Make notes of your readings in the table on page 14.
3 Verify performance and install everything (Pages 15-18). Before making any holes in
your roof or walls you’ll fully connect your system and run speed tests. If everything
looks good, you’ll finalize the cable runs and mount your ProLink.
5 Tell us how your system is doing — Nothing makes our day like hearing from customers.
And if for any reason you’re not seeing the results you were hoping for, we can help.
Visit setup.wf/ProLink to connect with our team of dedicated Signal Specialists and
access a bunch of helpful resources!
Install Process Overview
01
What Hardware Do You Need?
ProLink is not a Wi-Fi Router — to connect over Wi-Fi, you’ll need your own Wi-Fi router. For
testing, you’ll need a long extension cord, and a extension cord splitter. Additional tools may
be required depending on how you mount your ProLink:
For Wall Mounting:
• Drill with 3/8 inch (10 mm) bit
• 4x Wall Anchors (3/8 x 1-3/16 inch | 10 x 30 mm)
• 4x Screws (5/16 inch | 8 mm)
For Pole Mounting:
• Phillips-#2 Screwdriver
• Optional: Socket Wrench (9/32 inch | 7 mm)
What does the USB-C port do?
The USB-C port on the bottom of your ProLink is a diagnostic port that connects to the 5G
module. While it allows access via AT commands and the Linux shell, it isn’t needed for setup
— everything can be done through ProLink’s Web UI.
6

-- 6 of 32 --

Preparing For Testing
02
Since ProLink is directional, positioning & aiming it is critical for your install — but before you
do that, we’ll walk you through the best way to connect your system temporarily to make sure
that process is as easy as possible later in the manual — so don’t drill any holes just yet!
Connecting Your Test Setup
Refer to the diagram below as needed.
1 Pull the tab for the bottom left flap of your ProLink, and write down the Web UI user &
password. If a SIM card isn’t installed, pull the tab for the bottom right flap and insert
your SIM card into the SIM “1” slot. Then, firmly press each flap’s sides back into place.
2 Unscrew the cable gland from your ProLink and set it aside — you’ll need it later.
3 Connect the white 50 ft (15m) ethernet cable between your ProLink and the
“Amplimax” port of the POE injector.
4 Connect the black 5 ft (1.5 m) ethernet cable between the LAN port of the POE Injector
and your Wi-Fi router’s WAN port. Disconnect all other WANs from your Wi-Fi router.
5 Plug the power supply into the POE injector, then into a power outlet. After a few
moments, ProLink’s display will show carrier and band info, and a flashing orange/blue
LED will be visible through it’s bottom right flap.
6 Restart your Wi-Fi router. After it finishes rebooting, connect to it’s Wi-Fi and try visiting
speedtest.net. If the page loads and you’re able to start a speed test, your ProLink is
online, and you’re ready to start testing! If not, please reach out to us.
Unsure which port is the WAN port of your Wi-Fi router? Labeling can vary! WAN ports are usually
labeled “WAN”, “Internet”, or shown with a globe icon — and are often blue. LAN ports, however, are
usually labeled with numbers (1, 2, 3, etc.) and may be yellow or unmarked. Contact us if you’re unsure.
Quick
Tip
ProLink Your Wi-Fi
Router
WAN
50 ft (15 m)
Ethernet Cable
4.6 ft (1.4 m)
Ethernet Cable
PoE Injector &
Power Supply
AMPLIMAX
LAN
7

-- 7 of 32 --

• Are your ProLink’s display and status lights as described, but you don’t have an internet connection? If
so, the APN for your carrier is most likely incorrect. See page 21 for details.
• Is your ProLink’s display not as described? Refer to page 28 for guidance.
• Are your ProLink’s status lights not as described? Please reach out to us for help.
Troubleshooting Tips
8
Understanding How Your ProLink Works
03
Boot-up Sequence
After being plugged in, ProLink’s 4G/5G status light will briefly appear solid orange. Once it
completes its startup sequence and connects to a cellular network, the screen will display key
connection details: active SIM slot name, abbreviated carrier name, frequency band, signal
level, and cellular technology (e.g. SIM 1 TMO N41 90% 5G). See section 11 on page 28 for
more details on ProLink’s display.
At this point, the status light will quickly blink with alternating orange and blue flashes.
Status Lights
There are multiple status lights located under the bottom right flap of your ProLink, but the
“4G/5G” light is the most important since it flashes to indicate ProLink’s current status.
Solid Orange:
ProLink is performing its start-up sequence.
Blinking Orange & Blue:
ProLink is active.
The light beside each SIM slot & eSIM icon turn solid green for whichever SIM slot is selected.
Note: eSIMs are not currently supported.
Your ProLink “Searches” For Signal
Like a cell phone, ProLink searches for, and then connects to, the best signal available from
its carrier. Anytime you power-cycle your ProLink or change it’s settings, it will prompt you to
reboot so that it can start scanning to find the best signal.

-- 8 of 32 --

In a Rush? Use the Easy Install Feature!
We strongly recommend reading through the rest of this manual and completing the full
aiming process — it only takes a bit more effort than an “Easy Install”, but you’ll likely obtain
significantly better performance.
That said, while it’s not the most effective way to achieve the fastest data speeds, the Easy
Install feature can help you quickly identify a general position and direction for your ProLink.
Pressing the “Easy Install” button under the bottom right flap of your ProLink causes it to
enter “Easy Install Mode”. It’s screen will display key connection details in real-time while also
emitting a beeping sound that will beep faster as signal strength increases.
To exit “Easy Install Mode”, press the “Easy Install” button again.
The Easy Install feature is best utilized by jotting down the best positions and directions that
you find for your ProLink for each of the following outdoor positions, and sticking with the
position and direction with the highest signal level.
When switching between each side of the building, we recommend restarting your ProLink by
disconnecting and reconnecting its ethernet cable — this forces it to re-scan and connect to the
best available band(s) for each location.
9

-- 9 of 32 --

The goal here is to get the best data speeds. To understand how, it’s really helpful to have a
basic understanding of how cellular signal works.
Signal Percentage
ProLink’s signal percentage (similar to the bars on your phone) offers a quick snapshot of your
connection.
Signal percentage is meant to give you a rough idea of your signal conditions — but no single
number can tell the full story. It’s possible to see 90% and get slow speeds, or see 10% and
get great speeds. That’s why we recommend a speed test app (or ProLink’s cellular metrics
through its Web UI) instead.
Download our favorite speed test app ("Speedtest by Ookla") by visiting waveform.com/
speedtest and run a couple tests indoors to get a baseline of your signal — your results will
vary slightly, that’s normal. Just make sure your ProLink is connected to your Wi-Fi router and
your phone is connected to your router’s Wi-Fi when testing.
Signal Quality (SINR & RSRQ)
Signal quality is the most important measure of your cellular connection. There are two
different metrics used for signal quality — SINR and RSRQ. SINR measures loss in signal quality
due to interference, while RSRQ measures congestion on the cell tower.
Why does it drop? Because towers can interfere with each other — especially if you’re between
them. This “intracell interference” makes it harder for your device to maintain a clean, stable
connection. Higher quality signal can often be found by shielding and aiming your ProLink.
We’ll explain exactly how to position and aim your ProLink later in this manual.
Signal Strength (RSRP)
RSRP is the main measure of signal strength for cellular networks. Signal strength is generally
stronger the higher you go, but there’s often more interference, which worsens signal quality.
While stronger signals can help, signal quality matters more for achieving fast, reliable speeds.
A Quick Introduction to Cellular Signal
04
10

-- 10 of 32 --

Bands
ProLink, like your phone, connects to certain frequency bands on a cell tower.
Each frequency band spans a specific range of frequencies and can be divided into individual
channels, which determine its total data capacity. For example, Band n41 covers 2496–2690
MHz and can be sliced into 20 MHz channels.
Higher-frequency bands typically support more channels with more bandwidth each, enabling
faster theoretical speeds. However, they also have shorter range compared with lower-
frequency bands.
That said, higher-frequency bands are often less congested — meaning fewer users are
connected — which, combined with their greater bandwidth, can result in faster speeds when
connecting to them with directional antennas like those in ProLink. However, this isn’t always
true: depending on your location, lower-frequency bands may still deliver better performance.
ProLink supports up to “5x carrier aggregation”. It can combine up to five 4G LTE or 5G NSA
channels, or up to two 5G SA channels, at the same time for a maximum bandwidth of up to
100 MHz to increase data speeds and maximize performance.
Depending on the signal conditions in your area, your ProLink may only connect to a single
cellular band, or it could connect to multiple. Later in this manual we’ll walk you through
you experimenting with different combinations of frequency bands to see if a particular
combination gets you the best speeds (See Section 10 for details).
Okay, thanks for reading that!
We know that's a lot of information, but we promise it'll be helpful as you start your install. Our
goal is to get you strong, high-quality signal on the best possible bands so you can get the
best data speeds. Let's get started!
Low Frequency Bands
More congested, lower data speeds
Travel further, easily penetrate buildings
600 MHz (Band 71)
700 MHz (Bands 12, 13, 14, 17)
850 MHz (Band 5, 26)
1900 MHz (Band 2, 25)
2100 MHz (Band 4, 66)
2300 MHz (Band 30)
2500 MHz (Band 41)
2600 MHz (Band 38)
3500 MHz (Band 48)
3700 MHz (Band 77)
High Frequency Bands
Less congested, faster data speeds
Travel shorter
11

-- 11 of 32 --

Finding the best position for your ProLink is the most important part of the install. In this
section, we’ll walk you through a simple and effective method for positioning and aiming your
ProLink. Want to fine-tune things even further? Check out the advanced tips in Section 10.
The Goal
Your goal is to find the best position and direction for your ProLink. Its position should
maximize the data speeds through your Wi-Fi router. This means spending 30–60 minutes
testing different spots around your building.
It might be tempting to settle for a “good enough” spot, but taking the time to find the best
location can pay off with significantly faster speeds and more reliable connectivity.
1. Take your Test Setup Outside
Do you have a long extension cord and a
power splitter?
If so, use them to take your ProLink & Wi-Fi
router “test setup” outdoors. Then, restart
your Wi-Fi router & connect to it’s Wi-Fi (or
via ethernet, if possible).
Can’t take your router outdoors or don’t have a long power extension cable? No problem!
Keep your router and ProLink PoE injector powered indoors. Just keep in mind that your
data speed tests will likely be limited by your existing router’s Wi-Fi range, rather than your
ProLink’s cellular signal. If possible, have someone stay inside near the router to run speed
tests while you try different positions with your ProLink outdoors.
2. Get Ready to Perform Speed Tests
Since the goal is to maximize the data speeds provided from ProLink to your router, we’ll judge
the best position for your ProLink by measuring your data speeds. We recommend using
Speedtest by Ookla — visit waveform.com/speedtest
Now that your test setup is ready and your phone or laptop is connected to the Wi-Fi of your
Wi-Fi router, you’ll have everything you need to start testing at different positions outdoors.
Positioning and Aiming Your ProLink
05
POWER EXTENSION
CABLE
12

-- 12 of 32 --

Go ahead and run a couple of speed tests to get a baseline. You’ll notice your results fluctuate
a bit between tests — that’s completely normal.
3. Take Outdoor Measurements
Take 2–3 speed tests at each of the following outdoor positions with your ProLink. Record
your results in the table in section 6 on the next page.
For each new location, restart your ProLink by disconnecting and reconnecting its ethernet
cable — this forces it to re-scan and connect to the best available band(s) for each location.
Don’t just go to the highest point of the roof! While signal strength is generally stronger the
higher you go, there’s often more interference. As covered in Section 4, poor signal quality is
often caused by intra-cell interference — too many signals from nearby towers overlapping.
We’ve found it’s often better to mount ProLink on the side of the building, facing your
preferred tower, to “shield” it from other cell towers in the area. That said, sometimes the roof
will still be the best spot. The only way to know for sure? Test and compare.
13

-- 13 of 32 --

Your Measurements
06
Make notes of your data speed measurements
while you’re positioning and aiming your ProLink
at the various positions described in section 5.
Important: Each time you move to a new location,
power cycle ProLink to connect to the very best
band(s) available.
Position Download
Speed
Upload
Speed Band(s) RSRP SINR
Need more room? See the additional table on page 31.
Optional / Advanced
14

-- 14 of 32 --

07 Routing & Installing Your Cables
Once you’ve found the best position for your ProLink, it’s time to route and install your cables.
Planning Your Cable Path
How you run the outdoor Ethernet cable indoors will depend on whether you’re using the
included Window Entry Cable or routing the cable directly through a wall or other entry point.
Every building’s different, so there’s no step-by-step instructions we can apply to every
building — but here are some tips to help you figure out the best approach.
» Window. Don’t want to drill holes into your walls or roof to route the outdoor ethernet
cable into the building? Install the Ethernet Window Entry cable a convenient window to
create a cable path into the building.
» Conduits and grommets. You may have existing cable channels into your building from
other equipment (e.g. Cable internet, TV antenna, land-line phones, etc.)
» Drilled through the wall or roof. Don’t want to use the Window Entry Cable and don’t
have any existing conduits? You’ll need to drill a 3/4 inch (2 cm) diameter hole through an
exterior wall or roof to run the cable into the building.
When planning your cable path, keep these best practices in mind:
• Before attempting to route the cables through your building, lay the ethernet cables
out flat to straighten them. This will make them easier to work with.
• Avoid sharp bends, kinks, or twists that could damage your cables.
• Avoid sharp edges that might wear down the cable over time.
• Manage your cables with the zip ties to keep them safe and out of the way. If a cable
runs along the wall, use cable saddles to secure it to the wall.
• When pulling your cables, always pull on the cable jacket and never on the connectors
to prevent damage.
• Create a small “drip-loop” in the outdoor ethernet cable before it enters your building
— this helps prevent water from entering your building.
Cable Tips
15

-- 15 of 32 --

Getting the Complete Kit Set Up
Refer to the diagram on the next page as needed
1 Place ProLink at the spot you found in section 5.
2 Place your Wi-Fi router & ProLink POE Injector at their preferred indoor locations near
power outlets in the building.
3 Install ProLink’s cable gland for the white cable.
4 Create a cable path into your building with the window entry cable, or by penetrating a
wall or roof.
Using the Window Entry Cable
For the Window Entry Cable’s full install instructions, follow its included manual or find
its manual online at waveform.com/ethernet-entry-manual
Then, plug the 1.4 m (4.6 ft) black cable between the Window Entry Cable’s indoor
connector and the “Amplimax” port of the POE injector.
Routing through a Wall or Roof
Route the white cable into your building and plug it into the “Amplimax” port of the
POE injector. Refer to the previous page for suggestions.
Unscrew the cable gland
from ProLink, unscrew it’s
cover, and push out it’s seal
from inside.
1
Feed the white cable through
the cable gland’s parts and
plug it into your ProLink.
2
Thread the gland onto ProLink,
insert the seal between it’s
forks (stepped edge facing
fork tips), then fasten the cap.
3
Feed the white cable
through your entry cable
cap, seal, then tube.
15
1
Fasten the tube onto your
entry cable. Then, push
the seal between it’s forks.
16
3
Plug the white
cable into your
entry cable.
9
2
Fasten the cap
onto the tube.
17
4
Option 1
Option 2
16

-- 16 of 32 --

5 Connect the 50 ft (15 ft) black indoor ethernet cable between the POE Injector’s LAN
port and the WAN port of your existing router.
6 Restart your Wi-Fi router, wait for it to reconnect, then perform 1-2 speed tests to verify
that you are happy with your system’s performance.
ProLink
POE Injector
The ethernet cable plugged into it’s
“Amplimax” port goes to your ProLink.
The ethernet cable plugged into it’s
“LAN” port goes to the “WAN” port of
your existing router.
OPTIONAL:
Ethernet Window
Entry Cable
Your Existing
Router
Outdoor Ethernet Cable
White — 50 ft (15 m)
Indoor Ethernet Cable(s)
Black — 4.6 ft (1.4 m) and 50 ft (15 m)
These two cables are interchangeable in the
cable path. Connect them in the order most
suitable for the locations of ProLink’s POE
injector and your existing router.
If you are not using the ethernet window entry
cable, only one of these cables is needed.
Amplimax
LAN
WAN
• When connecting the Ethernet cables, make sure to follow the ports as labeled in the diagram above to
ensure each cable is plugged into the correct port. Most importantly, the cable coming from the LAN port
of the POE Injector must connect to the WAN port on your existing router.
• Unsure which port is the WAN port of your Wi-Fi router? Labeling can vary! WAN ports are usually labeled
“WAN”, “Internet”, or shown with a globe icon — and is often blue. LAN ports are usually labeled with
numbers (1, 2, 3, etc.) and may be yellow or unmarked. Please contact us if you’re still unsure.
Install Tips
17

-- 17 of 32 --

Now that you have all the components in your system connected and you’ve verified that you
are happy with your data speeds, it’s time to mount your ProLink!
ProLink can be installed against a pole or directly onto the exterior of your building.
Pole Mount (Allows Better Aiming) — Use the included clamps to mount ProLink
against a pole. If your kit includes the UltraPole, refer to its included manual, or find its manual
online at waveform.com/ultrapole-manual for assembly instructions.
Mounting Your ProLink
08
Thread the two metal clamps
through the mounting bracket
& partially tighten them
against your pole.
1
Adjust the direction and
height of ProLink, as needed.
2
Tighten the metal clamps
against your pole using a
Phillips #2 screwdriver or 9/32
inch (7 mm) socket wrench.
3
• When wall mounting, you may need to wiggle ProLink slightly to help it settle into place
during step 3. When aligned correctly, the holes on the sides of the brackets will line up.
• Mount ProLink with its cable gland facing downward to ensure proper weatherproofing.
Install
Tips
Option 1
Position the wall plate,
mark each hole, then
drill the pilot holes.
(Optional) Install wall
anchors into each hole.
1
With it’s center tab
facing upward, place
the wall plate against
the wall and install
the screws.
2
Slide the mounting
bracket’s upper tabs over
the wall plate’s center tab.
Then, press ProLink flat
against the wall and slide
it downwards.
3
Using a Phillips #2
screwdriver, secure
the mounting
bracket to the wall
plate with the two
Phillips #2 bolts.
4
Wall Mount — Use the included wall plate to mount ProLink directly against the
side of the building. Use wall anchors when installing on hard surfaces like concrete or soft
materials like drywall.
Option 2
18

-- 18 of 32 --

ProLink’s Web UI, can be used to configure and monitor your ProLink. We’ll go over the most
important tools and settings within this section, but feel free to reach out if you have any
questions.
Accessing the Web UI
To access your ProLink’s WebUI, follow these steps:
1 Ensure your ProLink & Wi-Fi router are connected and
powered on. It may take a few minutes for them to boot up.
2 Connect your phone to your router’s Wi-Fi signal or
connect your computer to your router’s LAN port.
3 Visit 192.168.10.254. When prompted, enter the admin
user & password printed under the left flap of your ProLink.
Band Locking — How do I disable and enable bands?
ProLink allows you to choose which bands it’s allowed to
attempt a connection with.
To disable & enable bands:
1 Tap the ≡ icon on the top left of the Web UI, then tap
the “Operating Bands” shortcut at the bottom of the
page.
2 Tap the bands you wish to disable. You can also disable
entire connection types by tapping 5G, 4G, or 3G.
3 Tap “SAVE” at the bottom of the page to confirm your
selection. Your ProLink will then prompt you to reboot
and rescan for signals across the set of enabled bands.
A Deep Dive into ProLink’s Web UI
09
19

-- 19 of 32 --

Signal Level is a measure of the signal
strength (RSRP) of that band — it should be
-115 dBm or better (i.e. closer to zero).
Signal Quality is a measure of the signal
quality (RSRQ) of that band — it should be -12
dB or better (i.e. closer to zero).
Signal to interference + noise ratio is a
measure of the signal quality (SINR) of that
band — it should be +3 dB or better (i.e. more
positive).
Band # identifies the signal band in use.
Cellular Metrics — Where are they? What are good values?
While we aimed your ProLink using speed tests, it’s cell metrics can be helpful for
troubleshooting, or during the advanced optimization steps we’ll cover in section 10.
To view ProLink’s cellular metrics:
1 Tap the ≡ icon on the top left of the Web UI.
2 Tap “System Status” to view the information for your ProLink’s cellular connection.
3 Scroll down to see each band(s) your ProLink is connecting to and tap “See Details”
beside each band to view it’s cellular metrics.
Refresh the page for new values. You won’t need to use all of this information in most cases,
but we’ve outlined some of the most important numbers below.
20

-- 20 of 32 --

APN — What is it? How do I change it?
The APN, or Access Point Name, is a network identifier that must be correctly configured on
your device for it to connect to the internet through your carrier’s network.
APN settings are usually automatically configured by your carrier when ProLink loads your
SIM card. However, you may need to manually configure your APN settings if you are using a
unique data plan or experiencing connectivity problems.
To change your APN settings:
1 Tap the “Auto APN” button on the Web UI’s main page.
2 Change the “APN Configuration” setting from “AUTO” to
“MANUAL” and enter the appropriate APN information
provided to you by your carrier. For most carriers & data
plans, you’ll only need to enter the APN.
3 Tap “Save Configuration”. ProLink will prompt you to
reboot and connect to the network using the new APN.
If you aren’t sure what APN configuration to use, please reach out!
TR069 & Remote Access — Why are they enabled?
Your ProLink comes pre-configured with two settings that allow authorized Waveform Signal
Specialists to assist you remotely through our secure remote support platform. To provide
assistance, our team may request your ProLink’s admin username & password.
TR-069 is industry standard for secure, encrypted remote access. It allows ProLink to be found
by our support platform, but doesn’t give us access to traffic or usage — only ProLink’s settings.
TR-069 Configuration, found in the Web UI Utility tab, is enabled by default with these values:
» ACS URL: http://us.ump.avsystem.cloud:10301/cloudacs/elsys
» Username & Password: acs
» Periodic Information is also enabled, with a reporting interval of 5 seconds. This uses a
tiny amount of data, but will have a negligible impact on your data usage.
The “Enable Remote Access for Waveform Support” setting, found in the Web UI Settings tab,
is also enabled by default and gives our support team permission to access your ProLink.
Note: If either of these settings is changed or disabled, our team won’t be able to offer
remote troubleshooting support. That said, you’re always in control — these settings can be
modified at any time if you prefer to privately manage your device.
21

-- 21 of 32 --

Connection Modes — What are they? Should I change it?
ProLink offers two different connection modes, Router and Bridge (IPPT).
In Router Mode (Default), ProLink acts as a full router:
» Creates its own private subnet (192.168.10.0/24)
» Acts as the default network gateway (192.168.10.254) for
device(s) with a direct wired connection to ProLink.
» Assigns IPs via DHCP
» Performs NAT (translates between internal and public IPs)
Router Mode is best for users who want plug-and-play internet.
In Bridge Mode, also known as IPPT (IP Passthrough) Mode,
ProLink acts more like a modem:
» Disables NAT and DHCP
» Passes the Public IP address from the carrier directly to the
downstream device (e.g. your Wi-Fi router).
» No longer routes traffic between subnets.
Bridge Mode is often used when ProLink is connected to a device (e.g. a Wi-Fi router) which
needs the public IP directly (e.g. for advanced routing, firewall rules, or VPNs) or is experiencing
issues with applications and services that rely on port forwarding or peer-to-peer connections.
We do not recommend Bridge Mode if your ProLink is connected directly to a device, like a
laptop or desktop computer. Doing so provides that device with a public IP from the carrier,
making it more vulnerable to cyberattacks & privacy breaches.
To change the Connection Mode for your ProLink:
1 Tap the ≡ icon on the top left of the Web UI, and tap “Connection Settings”.
2 Under “Connection Mode”, tap the mode you want to switch to.
3 Tap “SAVE CHANGES”. Your ProLink will then prompt you to reboot to apply the new
connection mode.
Note: With Bridge Mode enabled, ProLink’s Web UI may not be accessible if the
downstream device (e.g. your Wi-Fi router) has multiple WAN connections. You may need
to temporarily disconnect all other WAN connections from that device to regain access to
ProLink’s Web UI. If access to ProLink is lost, resetting to factory defaults will restore Router
Mode and access to it’s Web UI.
22

-- 22 of 32 --

Blind Search — What is it?
A “Blind Search” can be used to determine which carriers are strongest at your location and
can be performed using either the Easy Install button or the Web UI — but for both methods,
ProLink must be in Router Mode with no SIM cards inserted.
For best results, perform a Blind Search on each side of the building and record the signal
strength for each detected carrier.
Easy Install Button
1 Ensure no SIM cards are in your ProLink. If a SIM card is present, instead of a “Blind
Search”, your system will run an “Easy Install” — as described earlier in this manual.
2 Press the “Easy Install” button under the
bottom right flap of your ProLink. ProLink will
indicate Blind Search has started by beeping
and showing four dots on it’s display.
3 After approximately 1 minute, the names of the identified carriers and their 4G & 5G
signal levels will be shown on the display. e.g. <5G> TMO: 83%, ATT: 60%, VZW: 90%.
Web UI
1 Tap the ≡ icon on the top left of the Web UI, and tap
the “Blind Search” shortcut.
2 Tap the “Start Search” button at the bottom of the
screen to begin a blind search. The search may take a
few minutes, during which time ProLink’s display will
show four dots.
3 Once complete, the names of the identified carriers
and their signal levels will be listed at the bottom of
the page.
Note: If insufficient 5G signals are present, ProLink may not
display the signal levels of 4G service. Also, lesser known
carriers may be displayed by their PLMN.
Option 1
Option 2
23

-- 23 of 32 --

AT commands — How do I perform them?
AT commands are an advanced method for changing the settings of your ProLink and should
only be used by users who know what they are doing. Incorrectly entered AT commands can
cause permanent damage to your device or otherwise make it inaccessible.
To enter AT commands, follow these steps.
1 Tap the ≡ icon on the top left of the Web UI, tap
“Utility”, then tap “AT Commands”.
2 Tap the “Enable Debug mode” switch to allow AT
commands to be submitted.
3 Enter the command into the “Commands” field
and tap “SEND COMMANDS”.
When entered correctly, the “Commands sent
successfully!” banner will briefly be displayed at the top
of the page and the results from your command will be
shown below “Response”.
Please refer to the following page for a list of AT
commands. For the full list, or if you need help, please
reach out to us.
Note: Debug Mode may cause unexpected behavior if used for prolonged periods. To
ensure that your ProLink maintains correct functionality, we highly recommend that you
disable debug mode when you’re finished sending AT commands.
We allow access to AT commands because we believe in users’ right to access and repair
the devices they own. Modifying the IMEI of your ProLink is technically possible through AT
commands, but doing so may violate your carrier’s terms of service — and in some cases,
federal law if done with fraudulent intent. We provide this capability for legitimate, carrier-
approved use only. Always confirm with your carrier before making any changes.
Important Note: IMEI Modification
24

-- 24 of 32 --

AT Command Meaning
A/ Repeat Previous Command Line.
ATI Display MT Identification Information.
ATZ Restore All AT Command Settings from User-defined Profile.
AT&F Reset AT Command Settings to Factory Settings.
AT&V Display Current Configurations.
AT&W Store Current Settings to User-defined Profile.
AT+CEER Display Extended Error Report.
AT+CIMI Display International Mobile Subscriber Identity (IMSI).
AT+CPAS Mobile Equipment Activity Status.
AT+CPIN=”pin” Enter SIM card PIN code.
AT+EGMR=0,7 Display current International Mobile Equipment Identity (IMEI).
AT+ICCID Display Integrated Circuit Card Identifier (ICCID). A unique, 18-22 digit number
that identifies a SIM card.
AT+QENG=”servingcell” Display current service state for the connected cell.
AT+QENG=”neighbourcell” Display service state for all available neighbour cells.
AT+QNWINFO Display current network technology, operator number, band, and channel ID.
AT+QPOWD Power down ProLink.
AT+QRSRP Display the Network mode & RSRP for each internal antenna for the current
network. Range: -140 to -44 dBm. A value of -32768 indicates an error.
AT+QRSRQ Display the Network mode & RSRQ for each internal antenna for the current
network. Range: -20 to -3 dB. A value of -32768 indicates an error.
AT+QSINR
Display the Network mode & SINR for each internal antenna for the current
network. Range: -20 to 30 dB for LTE, -23 to 40 dB for 5G. A value of -32768
indicates an error.
AT+EGMR=1,7,”IMEI”
Replace existing IMEI with new value. Quotation marks included in the command.
e.g. AT+EGMR=1,7,”123456789012345”, changes the IMEI from it’s existing
value to 123456789012345.
We’re Here to Help!
We know, there’s a lot of information here and this can get very technical. If you’re running into
issues, aren’t happy with the performance of your system, or you’d just like a hand, we’d love
to help!
Simply visit setup.wf/ProLink to connect with our team of dedicated Signal Specialists and
access a bunch of helpful resources!
25

-- 25 of 32 --

Factory Reset — How do I do one?
Make a mistake? Forget the admin username & password? No worries! Perform a factory reset
to reset your ProLink’s settings to it’s factory defaults. This will erase all changed data and give
you a fresh start with your device.
Physical Reset Button
1 Press and hold the “Easy Install” button for
10 seconds. This button can be found under
the bottom right flap of your ProLink.
2 Once unpressed, ProLink will reboot and it’s
settings will be reset to it’s factory defaults.
Web UI
1 Tap the ≡ icon on the top left of the Web UI,
and tap “Settings”.
2 Tap “Restore factory default”, tap “Restore All”,
then tap “Restore” to confirm.
3 Once confirmed, ProLink will reboot and it’s
settings will be reset to it’s factory defaults.
Option 1
Option 2
We’re Here to Help!
If you’re running into issues, even after factory resetting your system, please reach out to our
team for help! We’d love to assist you!
Simply visit setup.wf/ProLink to connect with our team of dedicated Signal Specialists and
access a bunch of helpful resources!
26

-- 26 of 32 --

Optional: Advanced Optimization
10
By now, you should have a solid idea of how to position your ProLink for great performance.
For 95% of users, the steps covered earlier in this manual will deliver excellent results.
But if you’re willing to get technical and optimize your system for every last bit of performance,
these steps are for you:
1 Scan this QR code to get your free Virtual Site Survey — It
includes a map of your nearby towers, available signal bands,
and suggested directions to aim your ProLink.
2 Using the Site Survey as your guide, follow this process to
identify the fastest band(s) and tower by running speed tests
to compare results:
a. Aim and Bandlock. Point your ProLink at each nearby tower we recommend and lock
to each band that tower supports, one at a time.
c. Discover Additional Bands. ProLink attempts to connect to the best band(s) available,
but sometimes other bands may still be faster. By manually disabling the bands ProLink
first selected, you can force ProLink to reboot and scan for other available bands.
d. Test Band Combinations. ProLink supports up to “5x carrier aggregation”, allowing
it to combine up to five 4G LTE or 5G NSA channels, or up to two 5G SA channels, at
the same time for faster speeds. However, depending on your environment, one strong
band may outperform multiple aggregated bands, the only way to know is by testing.
To get the absolutely best data speeds, run speed tests with ProLink connected to each
band individually, and then to different combinations of bands.
3 Use your Cellular Metrics as a guide. As discussed in Section 4, signal strength (RSRP)
and signal quality (SINR / RSRQ) are key indicators of performance — and they respond
differently to changes in environment and placement.
As you test different towers, bands, and directions, track how these metrics change and
make a note of your findings on page 31 — each shift could reveal valuable clues into
what adjustments could give you that extra “Oomph” in data speeds.
27

-- 27 of 32 --

ProLink Display
11
When your ProLink connects to a cellular network, it will display it’s active SIM slot, followed by
the abbreviated carrier name, frequency band, signal level, and cellular technology (e.g. SIM 1
TMO N41 90% 5G). Refer to this table for all possible messages.
After 20 minutes of powering on your ProLink router, it’s LED display will go to sleep.
Status Message Meaning
BOOT ProLink is booting up.
Insert SIM No SIM card inserted. Insert a SIM and Reboot.
SIM# Active SIM card slot (e.g. SIM1)
ATT, TMO, or VRW Carrier connected to your ProLink (respectively: AT&T, T-Mobile, Verizon)
B#, or n# Band to which your ProLink is connected (e.g. B2)
XX% Received Signal Level Percentage, ranges from 0 to 99%
5G 5G Technology
4G 4G LTE Technology
SEARCHING NETWORK ProLink is searching the network for service.
LIMITED SERVICE Service is limited by the selected carrier. The reasons could be weak signal, SIM
card issues, roaming, or network registration issues.
UPDATING FW ProLink firmware is being updated
# V Supply voltage entering the equipment (e.g. 20 V)
PLMN
Public Land Mobile Network (PLMN) code. Displayed if the carrier is unknown.
PLMN=MCC+MNC (e.g. 213660). The full list of Mobile Country Code (MCC) &
Mobile Network Code (MNC) values can be found at mcc-mnc.com
In addition to the status messages provided by ProLink’s display, there are a number of error
messages that it could display as well. If you encounter any error codes, please reach out to us
with the error code so we can help you fix the issue.
Error Code Meaning
ER62 Incompatible or unrecognized hardware version.
ER63 Error when attempting to disable calls.
ER64 Device is blocked or in a blocked state.
ER65 Error in device register or enable flags.
... ...
28

-- 28 of 32 --

Error Code Meaning
... ...
ER66 Error in the UCI (Unified Configuration Interface)
ER68 Failure in AT command for network connection.
ER69 Error in DHCP settings (IP assignment).
ER70 EEPROM (Electrically Erasable Programmable Read-Only Memory) not detected
in the system.
ER71 EEPROM CRC integrity check error.
ER72 Error in the SIM card slot (detection or reading).
ER73 Error related to the device’s MAC address.
ER74 Error in the physical layer (PHY) driver
ER75 Error in USB port communication.
ER76 Error in the PCI Express (PCIe) interface.
ER77 Error reading or validating the device’s IMEI.
ER78 Error reading the PCB serial number.
ER79 Error related to the radio frequency (RF) module.
ER81 Pairing error. Mismatch between device
ER83 Error on the AT port (communication with the modem via AT commands).
Some Final Tips
12
» If data speeds decrease over time, consider re-optimizing your system. Occasionally
carriers will update their towers to broadcast different bands, light up new towers, or
simply turn off existing towers altogether. If your data speeds get worse, try repositioning
and re-aiming your ProLink to get better results.
» ProLink does not currently support “hot swapping” it’s SIM cards. SIM cards must be
inserted prior to powering on ProLink. If you insert or replace a SIM card while ProLink is
running, you’ll need to reboot it for the change to take effect.
We’re Here to Help!
We know, there’s a lot of information here. If you’re running into issues, aren’t happy with the
performance of your system, or you’d just like a hand, we’d love to help! Visit setup.wf/ProLink to
connect with our team of dedicated Signal Specialists and access a bunch of helpful resources!
29

-- 29 of 32 --

Tell Us How It Works
13
Did your installation go well? Are you having trouble positioning your ProLink? Do you think
our manual could be improved? Are your data speeds not quite what you were hoping?
Please tell us: Visit setup.wf/ProLink to connect with our team of dedicated Signal Specialists,
access a bunch of helpful resources, and more!
We’re a small team who loves hearing how our products perform and helping folks get the
absolute best data speeds in any given situation. So please, reach out!
Get $50/£40/€45 by sending us a video of your install:
We’d love to feature your success! Send a 30+ sec video to videos@waveform.com
showing your installed kit and speed test results from before and after your install. If
your ProLink is already installed, briefly switch your router to its original setup to get
your “before” results. Once we review your video, we’ll PayPal you those funds!
Earn 5% cash back for each friend you refer:
Love your ProLink? Refer a friend! They’ll get 5% off their kit, and you’ll earn 5%
(via PayPal) when they purchase directly from waveform.com. Visit waveform.com/
referrals to get started.
Get up to $1000 for each U.S. business you refer:
Know a business in the U.S. with poor cellular signal? Send them our way! If they
deploy one of our cellular coverage solutions, you can earn via PayPal:
• $250 for spaces between 20,000 and 100,000 sq. ft.
• $1,000 for spaces over 100,000 sq. ft.
To get started, simply send an email introduction with your referral to coverage@
waveform.com, and we’ll handle the rest.
Three ways to get money back!
30

-- 30 of 32 --

Position Download
Speed
Upload
Speed Band(s) RSRP SINR
Optional / Advanced
31

-- 31 of 32 --

Need help? We’re ready and waiting.
Outdoor Modems, like ProLink, aren’t always easy to
install. But the end result is worth it.
One of the benefits of buying from Waveform is our
lifetime technical support on every system we sell. We can
walk you through troubleshooting and fine-tuning your
installation for best results.
Simply scan this QR code or visit setup.wf/ProLink to
connect with our team of dedicated Signal Specialists, get
your free Virtual Site Survey, access installation guides,
and more!
We love solving tricky install problems.
v1.0.3
setup.wf/ProLink www.waveform.com 3411 W. Lake Center Dr.,
Santa Ana, CA 92704
by ed r we po

-- 32 of 32 --
