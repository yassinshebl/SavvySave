<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.0_Flash-8E75B2?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
</p>

# 💰 SavvySave

A smart financial planning application built for Egyptian users. Set up your profile once with your income and expenses, then create unlimited savings plans — manually or with AI. Track deposits, log spending, and get personalized AI-powered financial advice from Gemini.

Supports **light & dark mode** with persistent preference.


🌐 **Live App:** [https://savvysave-4f9cc.web.app](https://savvysave-4f9cc.web.app)

---

## ✨ Features

### 🔐 Authentication
- **Email/Password** sign-up & sign-in with display name
- **Google Sign-In** (one-click OAuth)
- **Password Reset** via email
- Persistent sessions with Firebase Auth state listener

### 👤 User Profile (Centralized Finances)
- One-time onboarding after first sign-up (2-step setup)
- **Monthly Income** — your total income after tax
- **Static Expenses** — fixed monthly costs (rent, subscriptions, transport, etc.)
- **Frequency support** — expenses can be set as:
  - `Monthly Fixed` — a flat amount per month
  - `Custom` — cost per occurrence × times per week × weeks per month (auto-calculates monthly total)
- Edit anytime from the ⚙️ **Profile Settings** page
- Financial data is shared across all plans — no redundant entry

### 📊 Dashboard
- **Financial summary bar** showing income, fixed expenses, and surplus at a glance
- All savings plans displayed as cards with:
  - Progress bar (saved vs. target)
  - Days remaining until deadline
  - Color-coded urgency badges (green → yellow → red)

### 📝 Create Plan (Manual)
- Simple 3-field form: **name**, **target amount**, and **deadline**
- Income and expenses automatically pulled from your profile

### ✨ AI Create Plan (Gemini-Powered)
- Describe your goal in plain text (e.g., *"Buy a PS5"*, *"Trip to Turkey"*)
- Set a deadline
- AI estimates the **realistic cost in Egypt (EGP)**, recommends monthly savings, and gives personalized advice
- Preview the AI-generated plan before saving

### 📈 Plan Details
- **Savings tracker** with deposit & withdrawal support and full history log
  - Loading state prevents duplicate submissions
  - Remove incorrect entries directly from history (auto-adjusts total savings)
- **Financial overview chart** (horizontal bar chart via Recharts):
  - Income vs. Static Expenses vs. Dynamic Spending vs. Remaining
- **Due date banner** with days remaining, months estimate, and required monthly savings
- **Spending log** — add dynamic one-off expenses per plan
- **Static expenses list** — pulled from your profile (read-only in plan view)
- **AI Advisor** — click ✨ to get real-time financial advice from Gemini on whether you're on track

### 🎨 Appearance
- **Light & Dark mode** — toggle from the navbar, preference saved in localStorage
- Clean, modern UI with smooth theme transitions

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.8 |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS (CDN) + Inter font + CSS custom properties for theming |
| **Backend** | Firebase (Firestore, Auth) |
| **AI** | Google Gemini 2.0 Flash via `@google/genai` |
| **Charts** | Recharts |
| **Hosting** | Firebase Hosting |

---

## 📁 Project Structure

```
savvysave/
├── index.html                 # Entry HTML with Tailwind config, theme variables & scrollbar
├── index.tsx                  # React root mount
├── App.tsx                    # Main app — routing, auth state, profile management
├── types.ts                   # TypeScript interfaces (User, UserProfile, SavingsPlan, Expense, etc.)
│
├── components/
│   ├── Auth.tsx               # Login / Sign-up / Password reset UI
│   ├── ProfileSetup.tsx       # First-time onboarding (income + expenses wizard)
│   ├── ProfileSettings.tsx    # Edit income & expenses anytime
│   ├── Dashboard.tsx          # Plan cards + financial summary
│   ├── CreatePlan.tsx         # Manual plan creation form
│   ├── AIPlan.tsx             # AI-powered plan generation
│   └── PlanDetails.tsx        # Full plan view with savings, chart, spending, AI advice
│
├── services/
│   ├── firebaseConfig.ts      # Firebase app initialization (Auth + Firestore)
│   ├── authService.ts         # Auth methods (email, Google, reset password)
│   ├── storageService.ts      # Firestore CRUD (profile + plans + transactions + savings)
│   └── geminiService.ts       # Gemini API (analyzePlan + generatePlan)
│
├── .env.local                 # Environment variables (VITE_GEMINI_API_KEY)
├── firebase.json              # Firebase Hosting config
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies & scripts
```

---

## 🗄️ Firestore Data Model

```
users/
└── {userId}/
    ├── profile/
    │   └── main               # { monthlyIncome, staticExpenses[] }
    └── plans/
        └── {planId}           # { name, targetAmount, dueDate, currentSavings,
                               #   savingsHistory[], transactions[], createdAt }
```

- **Profile** stores income and static expenses once — shared across all plans
- **Plans** only store plan-specific data (goal, target, dynamic spending, savings)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A [Firebase project](https://console.firebase.google.com/) with **Authentication** and **Firestore** enabled
- A [Gemini API key](https://aistudio.google.com/apikey) (free tier available)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/savvysave.git
cd savvysave
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the project root:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Configure Firebase
Update `services/firebaseConfig.ts` with your Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/) → Project Settings → Web App.

### 5. Run locally
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 6. Deploy to Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

---

## 🔑 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** → Sign-in Providers:
   - Email/Password
   - Google
3. Enable **Cloud Firestore** (start in test mode or configure security rules)
4. Register a **Web App** and copy the config object into `services/firebaseConfig.ts`

---

## 🤖 AI Features (Gemini)

SavvySave uses **Google Gemini 2.0 Flash** for two AI features:

| Feature | Description |
|---------|-------------|
| **AI Create Plan** | Describe a savings goal in plain text → AI estimates the cost in Egypt, calculates monthly savings needed, and provides practical advice |
| **AI Advisor** | Analyzes your full financial picture (income, expenses, savings progress) and gives personalized, actionable advice |

Both features use your profile data (income + expenses) for context-aware recommendations tailored to the Egyptian cost of living.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server (port 3000) |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |

---

## 🧩 Key TypeScript Interfaces

```typescript
interface UserProfile {
  monthlyIncome: number;
  staticExpenses: Expense[];
}

interface SavingsEntry {
  id: string;
  amount: number;        // positive = deposit, negative = withdrawal
  note: string;
  date: string;
}

interface SavingsPlan {
  id: string;
  name: string;
  targetAmount: number;
  dueDate: string;
  currentSavings: number;
  savingsHistory: SavingsEntry[];
  transactions: Expense[];      // dynamic spending per-plan
  createdAt: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;               // calculated monthly total
  category: string;
  date: string;
  isStatic: boolean;
  frequency?: 'monthly' | 'custom';
  costPerOccurrence?: number;   // for custom frequency
  timesPerWeek?: number;
  weeksPerMonth?: number;
}
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
