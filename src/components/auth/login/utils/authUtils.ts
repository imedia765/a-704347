import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from '@tanstack/react-query';

export const clearAuthState = async () => {
  console.log('Clearing existing session...');
  try {
    await supabase.auth.signOut();
    await new QueryClient().clear();
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

export const verifyMember = async (memberNumber: string) => {
  console.log('Verifying member:', memberNumber);
  try {
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('id, member_number, status')
      .eq('member_number', memberNumber)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (memberError) {
      console.error('Member verification error:', memberError);
      if (memberError.code === 'PGRST116') {
        throw new Error('Member not found or inactive');
      }
      throw memberError;
    }

    if (!members) {
      throw new Error('Member not found or inactive');
    }

    return members;
  } catch (error: any) {
    console.error('Member verification error:', error);
    throw error;
  }
};

export const getAuthCredentials = (memberNumber: string) => ({
  email: `${memberNumber.toLowerCase()}@temp.com`,
  password: memberNumber,
});