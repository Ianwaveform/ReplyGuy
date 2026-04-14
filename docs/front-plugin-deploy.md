# Front Plugin Deploy

This repo now has a dedicated Front sidebar plugin entry page at `/front-plugin.html`.

## What Gets Hosted

- Dashboard: `/`
- Front plugin: `/front-plugin.html`
- Backend API: `/api/*`

The Express server serves the built Vite app from `dist/` in production, so one web service can host both the frontend and backend.

## Render Setup

Recommended first host: Render.

### 1. Create the web service

- Push this repo to GitHub.
- In Render, create a new **Web Service** from the repo.
- Render will detect [render.yaml](/C:/Users/ianfo/Documents/ReplyGuy/render.yaml).

### 2. Required environment variables

Add these in Render:

- `OPENAI_API_KEY`
- `OPENAI_REPLY_MODEL=gpt-5.4`
- `FRONT_API_TOKEN`
- `FRONT_BASE_URL=https://api2.frontapp.com`
- `FRONT_PIPELINE_INBOXES=WF Help,WI - SMS Support,AMZ SMS,AMZ UK`

Optional:

- `PORT` is provided by Render automatically

### 3. Deploy

After deploy, Render will give you a base URL such as:

- `https://replyguy-front-plugin.onrender.com`

Your Front plugin URL will be:

- `https://replyguy-front-plugin.onrender.com/front-plugin.html`

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
- local `127.0.0.1` URLs are useful for development, but not for a normal production plugin setup
- if OpenAI quota is unavailable, the draft endpoint falls back to the local draft logic
