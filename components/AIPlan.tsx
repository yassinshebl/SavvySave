import React, { useState } from 'react';
import { generatePlan, AIGeneratedPlan } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { SavingsPlan, UserProfile } from '../types';

interface AIPlanProps {
    userId: string;
    profile: UserProfile;
    onCancel: () => void;
    onSave: () => void;
}

export const AIPlan: React.FC<AIPlanProps> = ({ userId, profile, onCancel, onSave }) => {
    // Form state — pre-filled from profile
    const [goalDescription, setGoalDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    // AI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AIGeneratedPlan | null>(null);
    const [saving, setSaving] = useState(false);

    const totalExpenses = profile.staticExpenses.reduce((a, b) => a + b.amount, 0);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const plan = await generatePlan(
                goalDescription,
                deadline,
                profile.monthlyIncome,
                totalExpenses,
            );
            setResult(plan);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!result) return;
        setSaving(true);
        try {
            const newPlan: SavingsPlan = {
                id: 'plan_' + Date.now(),
                name: result.name,
                targetAmount: result.targetAmount,
                dueDate: deadline,
                currentSavings: 0,
                savingsHistory: [],
                transactions: [],
                createdAt: new Date().toISOString(),
            };
            await storageService.savePlan(userId, newPlan);
            onSave();
        } catch (err) {
            setError('Failed to save plan. Please try again.');
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="text-gray-400 hover:text-white">&larr; Back</button>
                <h1 className="text-2xl font-bold text-white">✨ AI Create Plan</h1>
            </div>

            <p className="text-gray-400 text-sm">
                Describe what you want to save for and the AI will estimate the cost and create a plan for you.
                Your income ({profile.monthlyIncome.toLocaleString()} EGP) and expenses ({totalExpenses.toLocaleString()} EGP) are used from your profile.
            </p>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Phase 1: Input Form */}
            {!result && (
                <form onSubmit={handleGenerate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">What do you want to save for?</label>
                        <input
                            type="text"
                            required
                            value={goalDescription}
                            onChange={e => setGoalDescription(e.target.value)}
                            placeholder="e.g., Buy a PS5, Trip to Turkey, New iPhone 16..."
                            className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-700 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Be specific — the AI uses this to estimate the cost in Egypt.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Deadline</label>
                        <input
                            type="date"
                            required
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-700 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all text-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                AI is thinking...
                            </span>
                        ) : '✨ Generate Plan'}
                    </button>
                </form>
            )}

            {/* Phase 2: Preview Card */}
            {result && (
                <div className="space-y-5 animate-fade-in">
                    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{result.name}</h2>
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">AI Generated</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-dark/50 rounded-lg p-4">
                                <div className="text-xs text-gray-400 mb-1">Estimated Cost</div>
                                <div className="text-2xl font-bold text-white">{result.targetAmount.toLocaleString()} EGP</div>
                            </div>
                            <div className="bg-dark/50 rounded-lg p-4">
                                <div className="text-xs text-gray-400 mb-1">Save Monthly</div>
                                <div className="text-2xl font-bold text-emerald-400">{result.monthlySavings.toLocaleString()} EGP</div>
                            </div>
                        </div>

                        <div className="bg-dark/50 rounded-lg p-4">
                            <div className="text-xs text-gray-400 mb-1">Deadline</div>
                            <div className="text-white font-medium">
                                {new Date(deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>

                        <div className="bg-dark/50 rounded-lg p-4">
                            <div className="text-xs text-gray-400 mb-2">💡 AI Advice</div>
                            <p className="text-gray-300 text-sm leading-relaxed">{result.advice}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setResult(null); setError(null); }}
                            className="flex-1 px-4 py-3 text-gray-400 hover:text-white border border-gray-700 rounded-lg font-medium transition-colors"
                        >
                            ← Edit & Regenerate
                        </button>
                        <button
                            onClick={handleSavePlan}
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
                        >
                            {saving ? 'Saving...' : '✅ Save Plan'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
