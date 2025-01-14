import { Member } from "@/types/member";
import RoleBadge from "./RoleBadge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";

interface MembershipDetailsProps {
  memberProfile: Member;
  userRole: string | null;
}

type AppRole = 'admin' | 'collector' | 'member';

const MembershipDetails = ({ memberProfile, userRole }: MembershipDetailsProps) => {
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles', memberProfile.auth_user_id],
    queryFn: async () => {
      if (!memberProfile.auth_user_id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', memberProfile.auth_user_id);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return data.map(r => r.role) as AppRole[];
    },
    enabled: !!memberProfile.auth_user_id
  });

  const { data: lastPayment } = useQuery({
    queryKey: ['lastPayment', memberProfile.member_number],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('member_number', memberProfile.member_number)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching last payment:', error);
        return null;
      }

      return data;
    },
    enabled: !!memberProfile.member_number
  });

  const getHighestRole = (roles: AppRole[]): AppRole | null => {
    if (roles?.includes('admin')) return 'admin';
    if (roles?.includes('collector')) return 'collector';
    if (roles?.includes('member')) return 'member';
    return null;
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-dashboard-accent3/20 text-dashboard-accent3';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-dashboard-muted/20 text-dashboard-muted';
    }
  };

  const displayRole = userRoles?.length ? getHighestRole(userRoles) : userRole;

  return (
    <div className="space-y-2">
      <p className="text-dashboard-muted text-sm">Membership Details</p>
      <div className="space-y-2">
        <div className="text-dashboard-text flex items-center gap-2">
          Status:{' '}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            memberProfile?.status === 'active' 
              ? 'bg-dashboard-accent3/20 text-dashboard-accent3' 
              : 'bg-dashboard-muted/20 text-dashboard-muted'
          }`}>
            {memberProfile?.status || 'Pending'}
          </span>
        </div>
        {memberProfile?.collector && (
          <div className="text-dashboard-text flex items-center gap-2">
            <span className="text-dashboard-muted">Collector:</span>
            <span className="text-dashboard-accent1">{memberProfile.collector}</span>
          </div>
        )}
        <div className="text-dashboard-text flex items-center gap-2">
          <span className="text-dashboard-accent2">Type:</span>
          <span className="flex items-center gap-2">
            {memberProfile?.membership_type || 'Standard'}
            <RoleBadge role={displayRole} />
          </span>
        </div>
        
        {/* Last Payment Status */}
        <div className="text-dashboard-text flex items-center gap-2 mt-4">
          <CreditCard className="w-4 h-4 text-dashboard-muted" />
          <span className="text-dashboard-muted">Last Payment:</span>
          {lastPayment ? (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(lastPayment.status)}`}>
                {lastPayment.status}
              </span>
              <span className="text-dashboard-accent2">£{lastPayment.amount}</span>
            </div>
          ) : (
            <span className="text-dashboard-muted">No payments found</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipDetails;