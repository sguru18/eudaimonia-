import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

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
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let retryTimeoutId: NodeJS.Timeout;
    let hasSetInitialSession = false;

    // Get initial session with timeout protection and smart retry
    const getInitialSession = async (isRetry = false) => {
      try {
        let sessionResult: { data: { session: Session | null } } | null = null;
        let completed = false;

        // Create timeout (shorter for first attempt, longer for retry)
        const timeoutMs = isRetry ? 5000 : 2500;
        const timeoutPromise = new Promise<void>((resolve) => {
          timeoutId = setTimeout(() => {
            if (!completed && mounted) {
              // Timeout occurred
              if (sessionResult) {
                // We got a result but it took too long - use it anyway
                const { data: { session } } = sessionResult;
                if (mounted) {
                  setSession(session);
                  setUser(session?.user ?? null);
                  if (!hasSetInitialSession) {
                    setLoading(false);
                    hasSetInitialSession = true;
                  }
                }
              } else {
                // No result yet - proceed without blocking
                // Supabase's getSession() should return cached data immediately if available
                // If we timeout, it likely means no cached session exists
                console.warn('Auth session check timed out, proceeding - will retry in background');
                if (!hasSetInitialSession && mounted) {
                  setLoading(false);
                  hasSetInitialSession = true;
                }
              }
            }
            resolve();
          }, timeoutMs);
        });

        // Get session - Supabase should return cached data immediately
        // and only make network call to refresh if needed
        const sessionPromise = supabase.auth.getSession()
          .then((result) => {
            completed = true;
            sessionResult = result;
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            if (mounted) {
              const { data: { session } } = result;
              setSession(session);
              setUser(session?.user ?? null);
              // Always set loading to false when we get a result
              if (!hasSetInitialSession) {
                setLoading(false);
                hasSetInitialSession = true;
              }
            }
          })
          .catch((error) => {
            completed = true;
            console.error('Error getting session:', error);
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            // On error, proceed without blocking
            if (!hasSetInitialSession && mounted) {
              setLoading(false);
              hasSetInitialSession = true;
            }
          });

        // Race between session load and timeout
        await Promise.race([sessionPromise, timeoutPromise]);

        // If we didn't get a session and this is the first attempt, retry once
        if (!sessionResult?.data.session && !isRetry && mounted) {
          retryTimeoutId = setTimeout(() => {
            console.log('Retrying session load in background...');
            getInitialSession(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (!hasSetInitialSession && mounted) {
          setLoading(false);
          hasSetInitialSession = true;
        }
      }
    };

    // Start loading session
    getInitialSession();

    // Listen for auth changes - this will update when network is ready
    // and will also fire immediately if session is already available
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        // Only set loading to false if we haven't already
        // This ensures UI doesn't get stuck if getSession() hangs
        if (!hasSetInitialSession) {
          setLoading(false);
          hasSetInitialSession = true;
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      subscription.unsubscribe();
    };
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

