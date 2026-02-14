import React, { useState } from 'react';
import { Expense, UserProfile } from '../types';
import { storageService } from '../services/storageService';

interface ProfileSettingsProps {
    userId: string;
    profile: UserProfile;
    onBack: () => void;
    onUpdate: (profile: UserProfile) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userId, profile, onBack, onUpdate }) => {
    const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncome.toString());
    const [staticExpenses, setStaticExpenses] = useState<Expense[]>([...profile.staticExpenses]);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Add expense form state
    const [tempExpenseName, setTempExpenseName] = useState('');
    const [tempExpenseAmount, setTempExpenseAmount] = useState('');
    const [tempExpenseCategory, setTempExpenseCategory] = useState('Rent');
    const [tempFrequency, setTempFrequency] = useState<'monthly' | 'custom'>('monthly');
    const [tempCostPerOccurrence, setTempCostPerOccurrence] = useState('');
    const [tempTimesPerWeek, setTempTimesPerWeek] = useState('');
    const [tempWeeksPerMonth, setTempWeeksPerMonth] = useState('4');

    const calculateMonthlyAmount = (): number => {
        if (tempFrequency === 'monthly') return parseFloat(tempExpenseAmount) || 0;
        const cost = parseFloat(tempCostPerOccurrence) || 0;
        const times = parseFloat(tempTimesPerWeek) || 0;
        const weeks = parseFloat(tempWeeksPerMonth) || 4;
        return cost * times * weeks;
    };

    const handleAddExpense = () => {
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

    const handleRemoveExpense = (id: string) => {
        setStaticExpenses(staticExpenses.filter(e => e.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        const updated: UserProfile = {
            monthlyIncome: parseFloat(monthlyIncome),
            staticExpenses,
        };
        await storageService.saveProfile(userId, updated);
        onUpdate(updated);
        setSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const totalExpenses = staticExpenses.reduce((a, b) => a + b.amount, 0);
    const surplus = (parseFloat(monthlyIncome) || 0) - totalExpenses;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-white">&larr; Back</button>
                <h1 className="text-2xl font-bold text-white">⚙️ Profile Settings</h1>
            </div>

            {success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                    ✅ Profile updated successfully!
                </div>
            )}

            {/* Income */}
            <div className="bg-card p-6 rounded-xl border border-gray-800">
                <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Income (EGP)</label>
                <input
                    type="number"
                    min="1"
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-700 text-white text-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
            </div>

            {/* Static Expenses */}
            <div className="bg-card p-6 rounded-xl border border-gray-800 space-y-4">
                <label className="block text-sm font-medium text-gray-400">Static Monthly Expenses</label>

                {/* Expense List */}
                {staticExpenses.length > 0 && (
                    <div className="space-y-2">
                        {staticExpenses.map(e => (
                            <div key={e.id} className="flex justify-between items-center text-sm bg-dark/50 p-3 rounded-lg">
                                <div>
                                    <span className="text-gray-300">{e.name} ({e.category})</span>
                                    {e.frequency === 'custom' && (
                                        <span className="text-gray-500 text-xs ml-2">
                                            {e.costPerOccurrence} × {e.timesPerWeek}/wk × {e.weeksPerMonth}wk
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-medium">{e.amount.toLocaleString()} EGP/mo</span>
                                    <button onClick={() => handleRemoveExpense(e.id)} className="text-red-400 hover:text-red-300 text-lg">×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Expense */}
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
                                Monthly
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
                        <input type="number" placeholder="Monthly amount (EGP)" value={tempExpenseAmount} onChange={e => setTempExpenseAmount(e.target.value)} className="w-full px-3 py-2 rounded bg-dark border border-gray-700 text-sm text-white" />
                    )}

                    {tempFrequency === 'custom' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">EGP / occurrence</label>
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
                            <div className="text-sm text-secondary font-medium">= {calculateMonthlyAmount().toLocaleString()} EGP/month</div>
                        </div>
                    )}

                    <button onClick={handleAddExpense} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded font-medium">
                        + Add Expense
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-card p-6 rounded-xl border border-gray-800">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Income</div>
                        <div className="text-lg font-bold text-white">{(parseFloat(monthlyIncome) || 0).toLocaleString()} EGP</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Expenses</div>
                        <div className="text-lg font-bold text-red-400">{totalExpenses.toLocaleString()} EGP</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Surplus</div>
                        <div className={`text-lg font-bold ${surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{surplus.toLocaleString()} EGP</div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving || !monthlyIncome}
                className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
            >
                {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
        </div>
    );
};
