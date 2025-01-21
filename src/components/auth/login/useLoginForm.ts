import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthState, verifyMember, getAuthCredentials } from './utils/authUtils';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 5000; // 5 seconds

export const useLoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const attemptSignIn = async (email: string, password: string, retryCount = 0): Promise<any> => {
    try {
      console.log(`Sign in attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error(`Sign in error on attempt ${retryCount + 1}:`, error);
        
        if (error.message === 'Failed to fetch' && retryCount < MAX_RETRIES - 1) {
          const retryDelay = Math.min(
            INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
            MAX_RETRY_DELAY
          );
          console.log(`Retrying sign in after ${retryDelay}ms...`);
          await delay(retryDelay);
          return attemptSignIn(email, password, retryCount + 1);
        }
        throw error;
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Sign in attempt ${retryCount + 1} failed:`, error);
      throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !memberNumber.trim()) return;
    
    try {
      setLoading(true);
      console.log('Starting login process for member:', memberNumber);

      // First verify if member exists and is active
      const member = await verifyMember(memberNumber);
      console.log('Member verified:', member);

      // Get standardized credentials
      const { email, password } = getAuthCredentials(memberNumber);
      console.log('Attempting sign in with email:', email);
      
      // Clear any existing session
      await clearAuthState();
      
      // Attempt sign in with retry logic
      const { data: signInData, error: signInError } = await attemptSignIn(email, password);

      if (signInError) {
        console.error('Sign in error:', signInError);
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('Invalid credentials, attempting signup for member:', memberNumber);
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                member_number: memberNumber,
              },
              emailRedirectTo: window.location.origin
            }
          });

          if (signUpError) {
            console.error('Signup error:', signUpError);
            throw signUpError;
          }

          if (!signUpData.user) {
            throw new Error('Failed to create user account');
          }

          toast({
            title: "Account created",
            description: "Please check your email to verify your account",
          });
          return;
        }
        
        throw signInError;
      }

      if (!signInData.session) {
        throw new Error('No session established');
      }

      console.log('Login successful, redirecting to dashboard');
      await queryClient.invalidateQueries();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate('/', { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message.includes('Member not found')) {
        errorMessage = 'Member number not found or inactive';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid member number. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before logging in';
      } else if (error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    memberNumber,
    setMemberNumber,
    loading,
    handleLogin,
  };
};