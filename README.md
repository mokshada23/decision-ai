# Decision-ai 
**Stop drowning in browser tabs. Get one clear answer.**

We've all been there — you need to make a decision, you open 15 tabs, watch videos, read Reddit, and somehow end up more confused. decision-ai fixes that.

Describe your decision, set what matters to you, and an AI agent researches multiple sources, detects where they conflict, scores confidence, and delivers one clear recommendation — with curated websites, YouTube searches, and communities to verify it yourself.

---

## What's under the hood

- **6-step AI research agent** — plans, searches, compares, detects conflicts, scores confidence, reports
- **Real-time streaming** — watch the agent think step by step
- **Eval system** — measures AI output quality after every session
- **Continue chat** — ask follow up questions after the report

**Stack:** Next.js · Node.js · Express · PostgreSQL · Groq API · JWT · Tailwind CSS

---

## Run locally

```bash
git clone https://github.com/mokshada23/decision-ai.git

# Backend
cd backend && npm install && node index.js

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000`

---

*Built with curiosity and a genuine frustration with having too many browser tabs open.*
