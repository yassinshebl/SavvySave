# SavvySave 💰

A smart financial planning app built with React, Firebase, and Gemini AI.

## Features

- 🔐 **Authentication** — Email/password & Google Sign-In with forgot password
- 📊 **Savings Plans** — Set goals with target amounts and due dates
- 💸 **Expense Tracking** — Static (monthly) and dynamic (one-off) expenses with custom frequency support
- 💰 **Savings Tracking** — Deposit/withdraw with full history log
- 🤖 **AI Advisor** — Gemini-powered financial advice tailored to EGP
- ☁️ **Cloud Sync** — Data stored in Firestore, accessible from any device

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **AI:** Google Gemini API
- **Charts:** Recharts

## Run Locally

1. Install dependencies: `npm install`
2. Set `VITE_GEMINI_API_KEY` in `.env.local`
3. Run: `npm run dev`

## Deploy

```bash
npm run build
firebase deploy --only hosting
```

Live at: [savvysave-4f9cc.web.app](https://savvysave-4f9cc.web.app)
