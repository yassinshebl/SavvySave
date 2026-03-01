import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { CreatePlan } from './components/CreatePlan';
import { PlanDetails } from './components/PlanDetails';
import { AIPlan } from './components/AIPlan';
import { ProfileSetup } from './components/ProfileSetup';
import { ProfileSettings } from './components/ProfileSettings';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { User, UserProfile, SavingsPlan } from './types';

enum View {
  AUTH,
  PROFILE_SETUP,
  DASHBOARD,
  CREATE_PLAN,
  PLAN_DETAILS,
  AI_PLAN,
  PROFILE_SETTINGS,
}

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('savvysave-theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('savvysave-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const appUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
        };
        setUser(appUser);

        // Check if profile exists
        const existingProfile = await storageService.getProfile(firebaseUser.uid);
        if (existingProfile) {
          setProfile(existingProfile);
          setView(View.DASHBOARD);
        } else {
          setView(View.PROFILE_SETUP);
        }
      } else {
        setUser(null);
        setProfile(null);
        setView(View.AUTH);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (_loggedInUser: User) => {
    // Auth state change listener handles routing
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setView(View.AUTH);
  };

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setView(View.DASHBOARD);
  };

  const handleProfileUpdate = (updated: UserProfile) => {
    setProfile(updated);
  };

  const handleSelectPlan = (plan: SavingsPlan) => {
    setSelectedPlan(plan);
    setView(View.PLAN_DETAILS);
  };

  const handleSavePlan = () => {
    setView(View.DASHBOARD);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-darker text-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker text-gray-100 flex flex-col">
      {/* Navbar */}
      {user && view !== View.AUTH && view !== View.PROFILE_SETUP && (
        <nav className="border-b border-gray-800 bg-dark sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div
              className="font-bold text-xl text-primary cursor-pointer flex items-center gap-2"
              onClick={() => setView(View.DASHBOARD)}
            >
              SavvySave
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:block">
                Hi, <span className="text-white font-medium">{user.username}</span>
              </span>
              <button
                onClick={toggleTheme}
                className="text-gray-400 hover:text-white transition-colors text-lg"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => setView(View.PROFILE_SETTINGS)}
                className="text-gray-400 hover:text-white transition-colors text-lg"
                title="Profile Settings"
              >
                ⚙️
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {view === View.AUTH && <Auth onLogin={handleLogin} />}

        {view === View.PROFILE_SETUP && user && (
          <ProfileSetup userId={user.id} onComplete={handleProfileComplete} />
        )}

        {view === View.DASHBOARD && user && profile && (
          <Dashboard
            userId={user.id}
            profile={profile}
            onCreatePlan={() => setView(View.CREATE_PLAN)}
            onAIPlan={() => setView(View.AI_PLAN)}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {view === View.CREATE_PLAN && user && (
          <CreatePlan
            userId={user.id}
            onCancel={() => setView(View.DASHBOARD)}
            onSave={handleSavePlan}
          />
        )}

        {view === View.PLAN_DETAILS && selectedPlan && user && profile && (
          <PlanDetails
            userId={user.id}
            profile={profile}
            plan={selectedPlan}
            onBack={() => setView(View.DASHBOARD)}
            onUpdate={async () => {
              const updated = await storageService.getPlanById(user.id, selectedPlan.id);
              if (updated) setSelectedPlan(updated);
            }}
          />
        )}

        {view === View.AI_PLAN && user && profile && (
          <AIPlan
            userId={user.id}
            profile={profile}
            onCancel={() => setView(View.DASHBOARD)}
            onSave={handleSavePlan}
          />
        )}

        {view === View.PROFILE_SETTINGS && user && profile && (
          <ProfileSettings
            userId={user.id}
            profile={profile}
            onBack={() => setView(View.DASHBOARD)}
            onUpdate={handleProfileUpdate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-auto">
        <div className="text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} SavvySave. Smart financial planning.
        </div>
      </footer>
    </div>
  );
};

export default App;