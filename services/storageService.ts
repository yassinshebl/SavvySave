import { SavingsPlan, Expense, SavingsEntry, UserProfile } from '../types';
import { db } from './firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  increment,
} from 'firebase/firestore';

// ── Profile helpers ───────────────────────────────────────────
const getProfileDocRef = (userId: string) =>
  doc(db, 'users', userId, 'profile', 'main');

// ── Plan helpers ──────────────────────────────────────────────
const getUserPlansCollection = (userId: string) =>
  collection(db, 'users', userId, 'plans');

const getPlanDocRef = (userId: string, planId: string) =>
  doc(db, 'users', userId, 'plans', planId);

export const storageService = {
  // ── Profile CRUD ──────────────────────────────────────────
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(getProfileDocRef(userId));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  saveProfile: async (userId: string, profile: UserProfile): Promise<void> => {
    try {
      await setDoc(getProfileDocRef(userId), profile);
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    try {
      await updateDoc(getProfileDocRef(userId), updates);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // ── Plan CRUD ─────────────────────────────────────────────
  getPlans: async (userId: string): Promise<SavingsPlan[]> => {
    try {
      const snapshot = await getDocs(getUserPlansCollection(userId));
      const plans = snapshot.docs.map(d => d.data() as SavingsPlan);
      plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return plans;
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  },

  savePlan: async (userId: string, plan: SavingsPlan): Promise<void> => {
    try {
      await setDoc(getPlanDocRef(userId, plan.id), plan);
    } catch (error) {
      console.error('Error saving plan:', error);
      throw error;
    }
  },

  deletePlan: async (userId: string, planId: string): Promise<void> => {
    try {
      await deleteDoc(getPlanDocRef(userId, planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  },

  getPlanById: async (userId: string, planId: string): Promise<SavingsPlan | undefined> => {
    try {
      const snap = await getDoc(getPlanDocRef(userId, planId));
      return snap.exists() ? (snap.data() as SavingsPlan) : undefined;
    } catch (error) {
      console.error('Error fetching plan:', error);
      return undefined;
    }
  },

  addTransaction: async (userId: string, planId: string, transaction: Expense): Promise<SavingsPlan | null> => {
    try {
      const ref = getPlanDocRef(userId, planId);
      await updateDoc(ref, {
        transactions: arrayUnion(transaction),
      });
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as SavingsPlan) : null;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  updateSavings: async (userId: string, planId: string, entry: SavingsEntry): Promise<SavingsPlan | null> => {
    try {
      const ref = getPlanDocRef(userId, planId);
      await updateDoc(ref, {
        currentSavings: increment(entry.amount),
        savingsHistory: arrayUnion(entry),
      });
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as SavingsPlan) : null;
    } catch (error) {
      console.error('Error updating savings:', error);
      throw error;
    }
  },

  deleteSavingsEntry: async (userId: string, planId: string, entryId: string): Promise<void> => {
    try {
      const ref = getPlanDocRef(userId, planId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const plan = snap.data() as SavingsPlan;
      const updatedHistory = (plan.savingsHistory || []).filter(e => e.id !== entryId);
      const newTotal = updatedHistory.reduce((sum, e) => sum + e.amount, 0);

      await updateDoc(ref, {
        savingsHistory: updatedHistory,
        currentSavings: newTotal,
      });
    } catch (error) {
      console.error('Error deleting savings entry:', error);
      throw error;
    }
  },
};