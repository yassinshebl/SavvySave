export interface User {
  id: string;
  username: string;
  email: string;
}

export interface UserProfile {
  monthlyIncome: number;
  staticExpenses: Expense[];
}

export interface Expense {
  id: string;
  name: string;
  amount: number; // The calculated monthly total
  category: string;
  date: string;
  isStatic: boolean; // true for monthly fixed, false for dynamic

  // Frequency fields (for static expenses)
  frequency?: 'monthly' | 'custom';
  costPerOccurrence?: number; // e.g., 20 EGP per trip
  timesPerWeek?: number;      // e.g., 3 days a week
  weeksPerMonth?: number;     // e.g., 4 weeks a month
}

export interface SavingsEntry {
  id: string;
  amount: number; // positive = deposit, negative = withdrawal
  note: string;
  date: string;
}

export interface SavingsPlan {
  id: string;
  name: string;
  targetAmount: number;
  dueDate: string;
  currentSavings: number;
  savingsHistory: SavingsEntry[];
  transactions: Expense[]; // dynamic spending per-plan
  createdAt: string;
}

export interface AiAdvice {
  text: string;
  timestamp: string;
}
