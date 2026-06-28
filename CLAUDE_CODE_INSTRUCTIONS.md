# Claude Code Instructions — Idea Catcher

## What this is
A Next.js app that lets me capture ideas (text, links, screenshots), has Claude
auto-categorise them, and displays them as a Pinterest-style card board.
Everything is already built — your job is to install, configure, and deploy it.

---

## Step 1 — Install dependencies
Run in the project root:
```
npm install
```

---

## Step 2 — Set up the API key
1. Copy `.env.local.example` to `.env.local`
2. Open `.env.local`
3. Replace `your_api_key_here` with my real Anthropic API key
   (get it from https://console.anthropic.com/ → API Keys)

The file should look like:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Step 3 — Test it locally
```
npm run dev
```
Open http://localhost:3000 and make sure:
- The app loads
- You can type an idea and hit "✨ Catch idea"
- A card appears with a category badge

---

## Step 4 — Push to GitHub
If there's no git repo yet:
```
git init
git add .
git commit -m "Initial commit — Idea Catcher"
```

Then create a new repo on github.com and push:
```
git remote add origin https://github.com/YOUR_USERNAME/idea-catcher.git
git branch -M main
git push -u origin main
```

---

## Step 5 — Deploy to Vercel
1. Go to https://vercel.com → New Project
2. Import the GitHub repo you just pushed
3. On the "Configure Project" screen, open **Environment Variables**
4. Add one variable:
   - Name:  `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (same as in .env.local)
5. Click **Deploy**

Vercel will build and give you a live URL like:
  https://idea-catcher-yourname.vercel.app

---

## Project structure (for reference)
```
idea-catcher/
├── app/
│   ├── layout.js           ← root HTML shell
│   ├── page.js             ← renders IdeaCatcher
│   ├── globals.css         ← Tailwind base styles
│   └── api/analyze/
│       └── route.js        ← server-side Claude API call (keeps key secret)
├── components/
│   └── IdeaCatcher.jsx     ← full UI + localStorage persistence
├── .env.local.example      ← copy → .env.local, add API key
├── .env.local              ← YOUR real key (never committed to git)
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

---

## How it works (so you can make changes)
- **Ideas are stored in `localStorage`** in the user's browser. No database needed.
- **The Claude API call lives in `app/api/analyze/route.js`** — this is a
  Next.js server route, so the API key never touches the browser.
- **All UI is in `components/IdeaCatcher.jsx`** — categories, colours, card
  layout are all defined at the top of that file under `const CATS = { ... }`.

---

## Common issues
| Problem | Fix |
|---|---|
| "API error" on catch | Check `.env.local` has the right key and restart `npm run dev` |
| Styles look broken | Run `npm install` again — Tailwind may not have installed |
| Ideas lost after refresh | Normal in incognito mode — localStorage is cleared on exit |
| Vercel deploy fails | Make sure `ANTHROPIC_API_KEY` is set in Vercel environment variables |
