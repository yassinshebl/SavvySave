/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { SavingsPlan, UserProfile } from '../types';

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key not found. Set VITE_GEMINI_API_KEY in .env.local");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export const analyzePlan = async (plan: SavingsPlan, profile: UserProfile): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key is missing. Please configure VITE_GEMINI_API_KEY in .env.local";

  const totalStatic = profile.staticExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDynamic = plan.transactions.reduce((sum, e) => sum + e.amount, 0);
  const currentSavings = plan.currentSavings || 0;

  const prompt = `
    You are a financial advisor for an Egyptian user. All amounts are in Egyptian Pounds (EGP). Analyze the following savings plan and provide brief, actionable advice (max 150 words).
    
    Goal: ${plan.name}
    Target Amount: ${plan.targetAmount} EGP
    Monthly Income: ${profile.monthlyIncome} EGP
    Due Date: ${plan.dueDate || 'Not set'}
    Current Savings: ${currentSavings} EGP
    
    Fixed Expenses (Static):
    ${profile.staticExpenses.map(e => `- ${e.name}: ${e.amount} EGP/mo (${e.category})${e.frequency === 'custom' ? ` [${e.costPerOccurrence} EGP × ${e.timesPerWeek}/wk × ${e.weeksPerMonth}wk]` : ''}`).join('\n')}
    
    Recent Variable Spending (Dynamic):
    ${plan.transactions.slice(-10).map(e => `- ${e.name}: ${e.amount} EGP (${e.category})`).join('\n') || 'None yet'}
    
    Summary:
    - Total Fixed: ${totalStatic} EGP/mo
    - Total Variable: ${totalDynamic} EGP
    - Estimated Monthly Surplus: ${Math.max(0, profile.monthlyIncome - totalStatic - totalDynamic)} EGP
    - Saved so far: ${currentSavings} EGP of ${plan.targetAmount} EGP target (${((currentSavings / plan.targetAmount) * 100).toFixed(1)}%)

    Please tell the user if they are on track, suggest 1 specific area to cut costs, and offer encouragement. Keep advice practical for Egyptian cost of living.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text || "Could not generate advice at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't connect to the financial advisor service right now.";
  }
};

export interface AIGeneratedPlan {
  name: string;
  targetAmount: number;
  monthlySavings: number;
  advice: string;
}

export const generatePlan = async (
  goalDescription: string,
  deadline: string,
  monthlyIncome: number,
  monthlyExpenses: number,
): Promise<AIGeneratedPlan> => {
  const ai = getClient();
  if (!ai) throw new Error("API Key is missing. Please configure VITE_GEMINI_API_KEY in .env.local");

  const now = new Date();
  const due = new Date(deadline);
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const surplus = Math.max(0, monthlyIncome - monthlyExpenses);

  const prompt = `
    You are a financial planner for an Egyptian user. All amounts are in Egyptian Pounds (EGP).
    
    The user wants to save for the following goal:
    "${goalDescription}"
    
    Their financial situation:
    - Monthly Income: ${monthlyIncome} EGP
    - Monthly Expenses: ${monthlyExpenses} EGP
    - Monthly Surplus: ${surplus} EGP
    - Deadline: ${deadline} (${daysLeft} days / ~${monthsLeft} months away)
    
    Please estimate the realistic cost of this goal in Egypt (in EGP) and create a savings plan.
    
    Return ONLY a valid JSON object in this exact format, no markdown, no code fences:
    {
      "name": "Short plan name (2-4 words)",
      "targetAmount": <estimated cost as a number>,
      "monthlySavings": <recommended monthly savings as a number>,
      "advice": "2-3 sentences of practical advice for achieving this goal. Mention if it's achievable with their current surplus or if they need to cut expenses."
    }

    Rules:
    - targetAmount should be a realistic market estimate in Egypt
    - monthlySavings should not exceed their monthly surplus (${surplus} EGP) unless truly impossible, in which case explain in advice
    - monthlySavings * ${monthsLeft} should be >= targetAmount
    - Be practical and encouraging
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const text = (response.text || '').trim();
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      name: parsed.name || 'Savings Plan',
      targetAmount: Number(parsed.targetAmount) || 0,
      monthlySavings: Number(parsed.monthlySavings) || 0,
      advice: parsed.advice || '',
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Couldn't generate a plan right now. Please try again.");
  }
};