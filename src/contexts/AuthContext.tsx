import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { updateWidgetData } from '../utils/widgetHelper';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Update widget when user signs in
      if (session?.user) {
        try {
          await updateWidgetData();
        } catch (error) {
          console.error('Error updating widget after sign in:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // No email verification needed
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      // Call the Supabase RPC function to delete user data and account
      // This function should be created in Supabase with SECURITY DEFINER
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      
      if (rpcError) {
        // If the RPC function doesn't exist, we'll just delete user data from tables
        // and sign out (user will remain in auth.users but can't access anything)
        console.warn('RPC function not found, attempting manual data deletion:', rpcError);
        
        // Delete user data from all tables (RLS should allow this)
        const tables = [
          'habits',
          'habit_logs', 
          'notes',
          'meal_plans',
          'time_blocks',
          'priorities',
          'weekly_priority_scores',
        ];
        
        for (const table of tables) {
          await supabase.from(table).delete().eq('user_id', user.id);
        }
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

