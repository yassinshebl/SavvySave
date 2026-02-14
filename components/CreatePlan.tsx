import React, { useState } from 'react';
import { SavingsPlan } from '../types';
import { storageService } from '../services/storageService';

interface CreatePlanProps {
  userId: string;
  onCancel: () => void;
  onSave: () => void;
}

export const CreatePlan: React.FC<CreatePlanProps> = ({ userId, onCancel, onSave }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newPlan: SavingsPlan = {
      id: 'plan_' + Date.now(),
      name,
      targetAmount: parseFloat(targetAmount),
      dueDate,
      currentSavings: 0,
      savingsHistory: [],
      transactions: [],
      createdAt: new Date().toISOString(),
    };
    await storageService.savePlan(userId, newPlan);
    onSave();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="text-gray-400 hover:text-white">&larr; Back</button>
        <h1 className="text-2xl font-bold text-white">Create New Plan</h1>
      </div>

      <form onSubmit={handleSave} className="bg-card p-8 rounded-xl border border-gray-800 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">What are you saving for?</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., New Laptop, Emergency Fund, Trip to Turkey..."
            className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-700 text-white focus:ring-2 focus:ring-primary focus:outline-none"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Target Amount (EGP)</label>
          <input
            type="number"
            required
            min="1"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            placeholder="25000"
            className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-700 text-white focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Deadline</label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-lg bg-dark border border-gray-700 text-white focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 text-gray-400 hover:text-white border border-gray-700 rounded-lg">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name || !targetAmount || !dueDate}
            className="flex-1 bg-secondary hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {saving ? 'Creating...' : '✅ Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};