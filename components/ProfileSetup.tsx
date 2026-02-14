import React, { useState } from 'react';
import { Expense, UserProfile } from '../types';
import { storageService } from '../services/storageService';

interface ProfileSetupProps {
    userId: string;
    onComplete: (profile: UserProfile) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ userId, onComplete }) => {
    const [step, setStep] = useState(1);
    const [monthlyIncome, setMonthlyIncome] = useState('');

    // Static Expenses State
    const [staticExpenses, setStaticExpenses] = useState<Expense[]>([]);
    const [tempExpenseName, setTempExpenseName] = useState('');
    const [tempExpenseAmount, setTempExpenseAmount] = useState('');
    const [tempExpenseCategory, setTempExpenseCategory] = useState('Rent');

    // Frequency State
    const [tempFrequency, setTempFrequency] = useState<'monthly' | 'custom'>('monthly');
    const [tempCostPerOccurrence, setTempCostPerOccurrence] = useState('');
    const [tempTimesPerWeek, setTempTimesPerWeek] = useState('');
    const [tempWeeksPerMonth, setTempWeeksPerMonth] = useState('4');

    const [saving, setSaving] = useState(false);

    const calculateMonthlyAmount = (): number => {
        if (tempFrequency === 'monthly') return parseFloat(tempExpenseAmount) || 0;
        const cost = parseFloat(tempCostPerOccurrence) || 0;
        const times = parseFloat(tempTimesPerWeek) || 0;
        const weeks = parseFloat(tempWeeksPerMonth) || 4;
        return cost * times * weeks;
    };

    const handleAddStaticExpense = () => {
        if (tempFrequency === 'monthly' && !tempExpenseAmount) return;
        if (tempFrequency === 'custom' && (!tempCostPerOccurrence || !tempTimesPerWeek)) return;
        if (!tempExpenseName) return;

        const monthlyTotal = calculateMonthlyAmount();
        const newExpense: Expense = {
            id: Date.now().toString(),
            name: tempExpenseName,
            amount: monthlyTotal,
            category: tempExpenseCategory,
            date: new Date().toISOString(),
            isStatic: true,
            frequency: tempFrequency,
            ...(tempFrequency === 'custom' && {
                costPerOccurrence: parseFloat(tempCostPerOccurrence),
                timesPerWeek: parseFloat(tempTimesPerWeek),
                weeksPerMonth: parseFloat(tempWeeksPerMonth),
            }),
        };
        setStaticExpenses([...staticExpenses, newExpense]);
        setTempExpenseName('');
        setTempExpenseAmount('');
        setTempCostPerOccurrence('');
        setTempTimesPerWeek('');
        setTempWeeksPerMonth('4');
        setTempFrequency('monthly');
    };

    const handleRemoveStaticExpense = (id: string) => {
        setStaticExpenses(staticExpenses.filter(e => e.id !== id));
    };

    const handleFinish = async () => {
        setSaving(true);
        const profile: UserProfile = {
            monthlyIncome: parseFloat(monthlyIncome),
            staticExpenses,
        };
        await storageService.saveProfile(userId, profile);
        onComplete(profile);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
                <p className="text-gray-400">Let's set up your financial info — this applies to all your plans.</p>
                <div className="flex justify-center gap-2 mt-4">
                    {[1, 2].map(s => (
                        <div key={s} className={`w-16 h-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-700'}`} />
                    ))}
                </div>
            </div>

            {/* Step 1: Monthly Income */}
            {step === 1 && (
                <div className="bg-card p-8 rounded-xl border border-gray-800 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Income (EGP)</label>
                        <p className="text-xs text-gray-500 mb-3">Total income you receive per month after tax.</p>
                        <input
                            type="number"
                            required
                            min="1"
                            value={monthlyIncome}
                            onChange={e => setMonthlyIncome(e.target.value)}
                            placeholder="e.g., 6000"
                            className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-700 text-white text-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={() => { if (monthlyIncome) setStep(2); }}
                        disabled={!monthlyIncome}
                        className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Step 2: Static Expenses */}
            {step === 2 && (
                <div className="bg-card p-8 rounded-xl border border-gray-800 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Static Monthly Expenses</label>
                        <p className="text-xs text-gray-500 mb-3">Add your fixed expenses — rent, subscriptions, transport, etc.</p>
                    </div>

                    {/* Add Expense Form */}
                    <div className="space-y-3 border border-gray-700 rounded-lg p-4">
                        <input
                            placeholder="Expense name"
                            value={tempExpenseName}
                            onChange={e => setTempExpenseName(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-dark border border-gray-700 text-sm text-white focus:border-primary focus:outline-none"
                        />
                        <div className="flex gap-2">
                            <select
                                value={tempExpenseCategory}
                                onChange={e => setTempExpenseCategory(e.target.value)}
                                className="flex-1 px-3 py-2 rounded bg-dark border border-gray-700 text-sm text-white"
                            >
                                <option>Rent</option>
                                <option>Subscription</option>
                                <option>Utilities</option>
                                <option>Transport</option>
                                <option>Food</option>
                                <option>Insurance</option>
                                <option>Other</option>
                            </select>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTempFrequency('monthly')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${tempFrequency === 'monthly' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'}`}
                                >
                                    Monthly Fixed
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempFrequency('custom')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${tempFrequency === 'custom' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'}`}
                                >
                                    Custom
                                </button>
                            </div>
                        </div>

                        {tempFrequency === 'monthly' && (
                            <input
                                type="number"
                                placeholder="Monthly amount (EGP)"
                                value={tempExpenseAmount}
                                onChange={e => setTempExpenseAmount(e.target.value)}
                                className="w-full px-3 py-2 rounded bg-dark border border-gray-700 text-sm text-white"
                            />
                        )}

                        {tempFrequency === 'custom' && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">EGP per occurrence</label>
                                        <input type="number" placeholder="20" value={tempCostPerOccurrence} onChange={e => setTempCostPerOccurrence(e.target.value)} className="w-full px-3 py-2 rounded bg-dark border border-gray-700 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Times / week</label>
                                        <input type="number" placeholder="3" value={tempTimesPerWeek} onChange={e => setTempTimesPerWeek(e.target.value)} className="w-full px-3 py-2 rounded bg-dark border border-gray-700 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Weeks / month</label>
                                        <input type="number" placeholder="4" value={tempWeeksPerMonth} onChange={e => setTempWeeksPerMonth(e.target.value)} className="w-full px-3 py-2 rounded bg-dark border border-gray-700 text-sm text-white" />
                                    </div>
                                </div>
                                <div className="text-sm text-secondary font-medium">
                                    = {calculateMonthlyAmount().toLocaleString()} EGP/month
                                </div>
                            </div>
                        )}

                        <button onClick={handleAddStaticExpense} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded font-medium">
                            + Add Expense
                        </button>
                    </div>

                    {/* Expense List */}
                    {staticExpenses.length > 0 && (
                        <div className="space-y-2">
                            {staticExpenses.map(e => (
                                <div key={e.id} className="flex justify-between items-center text-sm bg-dark/50 p-3 rounded-lg">
                                    <div>
                                        <span className="text-gray-300">{e.name} ({e.category})</span>
                                        {e.frequency === 'custom' && (
                                            <span className="text-gray-500 text-xs ml-2">
                                                {e.costPerOccurrence} EGP × {e.timesPerWeek}/wk × {e.weeksPerMonth}wk
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-medium">{e.amount.toLocaleString()} EGP/mo</span>
                                        <button onClick={() => handleRemoveStaticExpense(e.id)} className="text-red-400 hover:text-red-300">×</button>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-gray-700 flex justify-between text-sm">
                                <span className="text-gray-400">Total Monthly Expenses</span>
                                <span className="text-white font-bold">{staticExpenses.reduce((a, b) => a + b.amount, 0).toLocaleString()} EGP/mo</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 text-gray-400 hover:text-white border border-gray-700 rounded-lg">
                            ← Back
                        </button>
                        <button
                            onClick={handleFinish}
                            disabled={saving}
                            className="flex-1 bg-secondary hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            {saving ? 'Saving...' : '✅ Complete Profile'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
