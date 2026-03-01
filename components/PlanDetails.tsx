import React, { useState } from 'react';
import { SavingsPlan, UserProfile, Expense, SavingsEntry } from '../types';
import { storageService } from '../services/storageService';
import { analyzePlan } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlanDetailsProps {
  userId: string;
  profile: UserProfile;
  plan: SavingsPlan;
  onBack: () => void;
  onUpdate: () => void;
}

export const PlanDetails: React.FC<PlanDetailsProps> = ({ userId, profile, plan, onBack, onUpdate }) => {
  const [showAddTx, setShowAddTx] = useState(false);
  const [txName, setTxName] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Savings modal state & loading
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsAction, setSavingsAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsNote, setSavingsNote] = useState('');
  const [savingsLoading, setSavingsLoading] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<SavingsEntry | null>(null);

  // Use profile income/expenses
  const totalStatic = profile.staticExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDynamic = plan.transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = totalStatic + totalDynamic;
  const remaining = profile.monthlyIncome - totalExpenses;

  const currentSavings = plan.currentSavings || 0;
  const savingsProgress = Math.min(100, (currentSavings / plan.targetAmount) * 100);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txName || !txAmount) return;

    const newTx: Expense = {
      id: Date.now().toString(),
      name: txName,
      amount: parseFloat(txAmount),
      category: txCategory,
      date: new Date().toISOString(),
      isStatic: false
    };

    await storageService.addTransaction(userId, plan.id, newTx);
    setTxName('');
    setTxAmount('');
    setShowAddTx(false);
    onUpdate();
  };

  const handleSavingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingsAmount || savingsLoading) return;

    setSavingsLoading(true);
    try {
      const amount = parseFloat(savingsAmount);
      const entry: SavingsEntry = {
        id: Date.now().toString(),
        amount: savingsAction === 'deposit' ? amount : -amount,
        note: savingsNote || (savingsAction === 'deposit' ? 'Deposit' : 'Withdrawal'),
        date: new Date().toISOString(),
      };

      await storageService.updateSavings(userId, plan.id, entry);
      setSavingsAmount('');
      setSavingsNote('');
      setShowSavingsModal(false);
      onUpdate();
    } finally {
      setSavingsLoading(false);
    }
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    setAdvice(null);
    const result = await analyzePlan(plan, profile);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteEntry) return;
    const entry = confirmDeleteEntry;
    setDeletingEntryId(entry.id);
    setConfirmDeleteEntry(null);
    try {
      await storageService.deleteSavingsEntry(userId, plan.id, entry.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete entry:', err);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setDeletingEntryId(null);
    }
  };

  const chartData = [
    { name: 'Income', value: profile.monthlyIncome, color: '#10b981' },
    { name: 'Static', value: totalStatic, color: '#3b82f6' },
    { name: 'Dynamic', value: totalDynamic, color: '#f59e0b' },
    { name: 'Remaining', value: Math.max(0, remaining), color: '#6366f1' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-white flex-1">{plan.name}</h1>
        <button
          onClick={handleGetAdvice}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loadingAdvice ? 'Analyzing...' : '✨ AI Advisor'}
        </button>
      </div>

      {advice && (
        <div className="bg-purple-900/30 border border-purple-500/50 p-6 rounded-xl text-purple-100 relative">
          <button onClick={() => setAdvice(null)} className="absolute top-2 right-4 text-purple-300 hover:text-white">×</button>
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
            Gemini Advisor
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{advice}</p>
        </div>
      )}

      {/* Savings Progress Card */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 p-6 rounded-xl border border-emerald-500/30">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Saved</div>
            <div className="text-3xl font-bold text-white">{currentSavings.toLocaleString()} EGP</div>
            <div className="text-sm text-gray-400 mt-1">
              of {plan.targetAmount.toLocaleString()} EGP target
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowSavingsModal(true); setSavingsAction('deposit'); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Deposit
            </button>
            <button
              onClick={() => { setShowSavingsModal(true); setSavingsAction('withdraw'); }}
              className="bg-red-600/80 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              − Withdraw
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${savingsProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{savingsProgress.toFixed(1)}% complete</span>
          <span>{(plan.targetAmount - currentSavings).toLocaleString()} EGP remaining</span>
        </div>
      </div>

      {/* Savings Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSavingsModal(false)}>
          <div className="bg-card border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">
              {savingsAction === 'deposit' ? '💰 Deposit Savings' : '📤 Withdraw Savings'}
            </h3>
            <form onSubmit={handleSavingsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (EGP)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={savingsAmount}
                  onChange={e => setSavingsAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-600 text-white text-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={savingsNote}
                  onChange={e => setSavingsNote(e.target.value)}
                  placeholder={savingsAction === 'deposit' ? 'e.g., Monthly savings' : 'e.g., Emergency expense'}
                  className="w-full px-4 py-2 rounded-lg bg-dark border border-gray-600 text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSavingsModal(false)} className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-700 rounded-lg">Cancel</button>
                <button
                  type="submit"
                  disabled={savingsLoading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${savingsLoading ? 'opacity-60 cursor-not-allowed' : ''} ${savingsAction === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {savingsLoading ? 'Processing…' : savingsAction === 'deposit' ? 'Deposit' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Due Date Banner */}
      {plan.dueDate && (() => {
        const now = new Date();
        const due = new Date(plan.dueDate);
        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
        const amountLeft = Math.max(0, plan.targetAmount - currentSavings);
        const requiredMonthly = amountLeft / monthsLeft;
        return (
          <div className={`p-4 rounded-xl border flex items-center justify-between ${daysLeft <= 0 ? 'bg-red-500/10 border-red-500/30' :
            daysLeft <= 30 ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-primary/10 border-primary/30'
            }`}>
            <div>
              <div className="text-sm text-gray-300">Due: <span className="text-white font-medium">{due.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
              <div className="text-xs text-gray-400 mt-0.5">
                {daysLeft <= 0 ? 'This plan is overdue!' : `${daysLeft} days remaining (~${monthsLeft} months)`}
              </div>
            </div>
            {daysLeft > 0 && (
              <div className="text-right">
                <div className="text-xs text-gray-400">Need to save</div>
                <div className="text-lg font-bold text-white">{requiredMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP/mo</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Monthly Income</div>
          <div className="text-2xl font-bold text-secondary">{profile.monthlyIncome.toLocaleString()} EGP</div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-red-400">{totalExpenses.toLocaleString()} EGP</div>
          <div className="text-xs text-gray-500 mt-1">Static: {totalStatic.toLocaleString()} | Dynamic: {totalDynamic.toLocaleString()}</div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Available to Save</div>
          <div className={`text-2xl font-bold ${remaining > 0 ? 'text-primary' : 'text-red-500'}`}>
            {remaining.toLocaleString()} EGP
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-card p-6 rounded-xl border border-gray-800 overflow-hidden">
        <h3 className="text-white text-sm font-medium mb-4">Financial Overview</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', padding: '8px 12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                formatter={(value: number) => [`${value.toLocaleString()} EGP`]}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                itemStyle={{ color: '#fff' }}
                separator=""
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Static List — from profile */}
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-gray-800/50 p-4 border-b border-gray-700">
            <h3 className="text-white font-medium">Static Expenses (from Profile)</h3>
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {profile.staticExpenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No static expenses in profile.</p>
            ) : (
              profile.staticExpenses.map(e => (
                <div key={e.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-300">{e.name} <span className="text-gray-500 text-xs ml-1">({e.category})</span></span>
                    {e.frequency === 'custom' && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {e.costPerOccurrence} EGP × {e.timesPerWeek}/wk × {e.weeksPerMonth}wk
                      </div>
                    )}
                  </div>
                  <span className="text-white font-mono">{e.amount.toLocaleString()} EGP/mo</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic / Spending Log */}
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="bg-gray-800/50 p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Spending Log</h3>
            <button
              onClick={() => setShowAddTx(!showAddTx)}
              className="text-xs bg-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded transition-colors"
            >
              + Add Spending
            </button>
          </div>

          {showAddTx && (
            <form onSubmit={handleAddTransaction} className="p-4 bg-gray-800/30 border-b border-gray-700 animate-slide-down">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  required
                  placeholder="What did you buy?"
                  value={txName}
                  onChange={(e) => setTxName(e.target.value)}
                  className="col-span-2 px-3 py-2 rounded bg-dark border border-gray-600 text-sm text-white focus:border-primary focus:outline-none"
                />
                <input
                  required
                  type="number"
                  placeholder="Amount (EGP)"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="px-3 py-2 rounded bg-dark border border-gray-600 text-sm text-white focus:border-primary focus:outline-none"
                />
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="px-3 py-2 rounded bg-dark border border-gray-600 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option>Food</option>
                  <option>Outing</option>
                  <option>Shopping</option>
                  <option>Transport</option>
                  <option>Emergency</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-secondary hover:bg-emerald-600 text-white text-sm py-2 rounded font-medium">
                Save Transaction
              </button>
            </form>
          )}

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-64">
            {plan.transactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No extra spending recorded yet.</p>
            ) : (
              plan.transactions.slice().reverse().map(e => (
                <div key={e.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                  <div>
                    <div className="text-gray-200">{e.name}</div>
                    <div className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()} • {e.category}</div>
                  </div>
                  <span className="text-red-400 font-mono">-{e.amount.toLocaleString()} EGP</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDeleteEntry(null)}>
          <div className="bg-card border border-gray-700 rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Remove Entry?</h3>
            <p className="text-gray-400 text-sm mb-4">
              This will remove the {confirmDeleteEntry.amount > 0 ? 'deposit' : 'withdrawal'} of{' '}
              <span className="text-white font-medium">{Math.abs(confirmDeleteEntry.amount).toLocaleString()} EGP</span>{' '}
              and adjust your total savings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteEntry(null)}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Savings History */}
      {(plan.savingsHistory || []).length > 0 && (
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-gray-800/50 p-4 border-b border-gray-700">
            <h3 className="text-white font-medium">Savings History</h3>
          </div>
          <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
            {(plan.savingsHistory || []).slice().reverse().map(entry => (
              <div key={entry.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                <div>
                  <div className="text-gray-200">{entry.note}</div>
                  <div className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-medium ${entry.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()} EGP
                  </span>
                  <button
                    onClick={() => setConfirmDeleteEntry(entry)}
                    disabled={deletingEntryId === entry.id}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-40 text-sm font-bold"
                    title="Remove entry"
                  >
                    {deletingEntryId === entry.id ? '…' : '−'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};