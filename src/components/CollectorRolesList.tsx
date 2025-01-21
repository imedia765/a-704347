import { useEffect, useState } from 'react';
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type UserRole = Database['public']['Enums']['app_role'];

interface RoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

const isValidRole = (role: string): role is UserRole => {
  return ['admin', 'collector', 'member'].includes(role);
};

const CollectorRolesList = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      console.log('Fetching roles...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) {
        console.error('Error fetching roles:', error);
        throw error;
      }

      console.log('Fetched roles:', data);
      setRoles(data || []);
    } catch (error: any) {
      console.error('Error in fetchRoles:', error);
      toast({
        title: "Error fetching roles",
        description: error.message || "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isValidRole(newRole)) {
      console.error('Invalid role:', newRole);
      return;
    }
    
    try {
      console.log('Updating role for user:', userId, 'to:', newRole);
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `User role changed to ${newRole}`,
      });
      fetchRoles(); // Refresh roles after update
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error updating role",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) {
    return <Loader2 className="w-8 h-8 animate-spin text-dashboard-accent1" />;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Collector Roles</h2>
      <ul>
        {roles.map(roleRecord => (
          <li key={roleRecord.id}>
            <span>{roleRecord.role}</span>
            <button onClick={() => handleRoleChange(roleRecord.user_id, 'admin')}>Make Admin</button>
            <button onClick={() => handleRoleChange(roleRecord.user_id, 'collector')}>Make Collector</button>
            <button onClick={() => handleRoleChange(roleRecord.user_id, 'member')}>Make Member</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollectorRolesList;