import React, { useEffect, useState } from 'react';
import { SavingsPlan, UserProfile } from '../types';
import { storageService } from '../services/storageService';

interface DashboardProps {
  userId: string;
  profile: UserProfile;
  onSelectPlan: (plan: SavingsPlan) => void;
  onCreatePlan: () => void;
  onAIPlan: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userId, profile, onSelectPlan, onCreatePlan, onAIPlan }) => {
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const data = await storageService.getPlans(userId);
      setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, [userId]);

  const calculateProgress = (plan: SavingsPlan) => {
    const saved = plan.currentSavings || 0;
    return {
      saved,
      percentage: Math.min(100, (saved / plan.targetAmount) * 100)
    };
  };

  const getDaysRemaining = (dueDate: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const totalExpenses = profile.staticExpenses.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="bg-card p-4 rounded-xl border border-gray-800 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-gray-400">Income:</span>{' '}
          <span className="text-white font-medium">{profile.monthlyIncome.toLocaleString()} EGP</span>
        </div>
        <div>
          <span className="text-gray-400">Fixed Expenses:</span>{' '}
          <span className="text-red-400 font-medium">{totalExpenses.toLocaleString()} EGP</span>
        </div>
        <div>
          <span className="text-gray-400">Surplus:</span>{' '}
          <span className="text-emerald-400 font-medium">{(profile.monthlyIncome - totalExpenses).toLocaleString()} EGP</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Your Plans</h1>
        <div className="flex gap-3">
          <button
            onClick={onAIPlan}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <span>✨</span> AI Create Plan
          </button>
          <button
            onClick={onCreatePlan}
            className="bg-secondary hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>+</span> Create Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-400">Loading your plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-gray-700">
          <p className="text-gray-400 mb-4">You haven't created any savings plans yet.</p>
          <button
            onClick={onCreatePlan}
            className="text-primary hover:text-blue-400 font-medium"
          >
            Start your first plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const { saved, percentage } = calculateProgress(plan);
            const daysLeft = getDaysRemaining(plan.dueDate);
            return (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan)}
                className="bg-card p-6 rounded-xl border border-gray-800 hover:border-primary cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-400">Target: {plan.targetAmount.toLocaleString()} EGP</p>
                  </div>
                  {daysLeft !== null && (
                    <span className={`text-xs px-2 py-1 rounded font-medium ${daysLeft <= 0 ? 'bg-red-500/20 text-red-400' :
                      daysLeft <= 30 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                      {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Saved</span>
                    <span className="text-white font-medium">{saved.toLocaleString()} EGP</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-secondary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {plan.dueDate && `Due: ${new Date(plan.dueDate).toLocaleDateString()}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};