import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

const googleProvider = new GoogleAuthProvider();

export const authService = {
    signUpWithEmail: async (email: string, password: string, displayName: string): Promise<FirebaseUser> => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        return credential.user;
    },

    signInWithEmail: async (email: string, password: string): Promise<FirebaseUser> => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential.user;
    },

    signInWithGoogle: async (): Promise<FirebaseUser> => {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    },

    signOut: async (): Promise<void> => {
        await firebaseSignOut(auth);
    },

    onAuthChange: (callback: (user: FirebaseUser | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },

    resetPassword: async (email: string): Promise<void> => {
        await sendPasswordResetEmail(auth, email);
    },
};
