import { useEffect, useState } from 'react';
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type UserRole = Database['public']['Enums']['app_role'];

const isValidRole = (role: string): role is UserRole => {
  return ['admin', 'collector', 'member'].includes(role);
};

const CollectorRolesList = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;

      setRoles(data);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
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
        {roles.map(role => (
          <li key={role.user_id}>
            <span>{role.role}</span>
            <button onClick={() => handleRoleChange(role.user_id, 'admin')}>Make Admin</button>
            <button onClick={() => handleRoleChange(role.user_id, 'collector')}>Make Collector</button>
            <button onClick={() => handleRoleChange(role.user_id, 'member')}>Make Member</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollectorRolesList;
