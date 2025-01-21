import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useEnhancedRoleAccess } from '@/hooks/useEnhancedRoleAccess';
import { useRoleSync } from '@/hooks/useRoleSync';
import { useCollectorsData } from '@/hooks/useCollectorsData';
import { CollectorRolesHeader } from './collectors/roles/CollectorRolesHeader';
import { CollectorRolesRow } from './collectors/roles/CollectorRolesRow';
import { UserRole, CollectorInfo } from "@/types/collector-roles";

export const CollectorRolesList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { roleLoading, error: roleError, permissions } = useRoleAccess();
  const { isLoading: enhancedLoading } = useEnhancedRoleAccess();
  const { syncRoles } = useRoleSync();
  const { data: collectors = [], isLoading, error } = useCollectorsData();

  const handleRoleChange = async (userId: string, role: UserRole, action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ 
            user_id: userId, 
            role: role as UserRole 
          }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role as UserRole);
        if (error) throw error;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['collectors-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      
      toast({
        title: "Role updated",
        description: `Successfully ${action}ed ${role} role`,
      });
    } catch (error) {
      console.error('Role update error:', error);
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (userId: string) => {
    try {
      await syncRoles([userId]);
      await queryClient.invalidateQueries({ queryKey: ['collectors-roles'] });
      toast({
        title: "Sync initiated",
        description: "Role synchronization process has started",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "An error occurred during sync",
        variant: "destructive",
      });
    }
  };

  if (error || roleError) {
    return (
      <div className="flex items-center justify-center p-4 text-dashboard-error">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span>Error loading collectors</span>
      </div>
    );
  }

  if (isLoading || roleLoading || enhancedLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-dashboard-dark to-dashboard-card rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-dashboard-accent1 to-dashboard-accent2 bg-clip-text text-transparent">
          Active Collectors and Roles
        </h2>
        <Badge 
          variant="outline" 
          className="bg-dashboard-accent1/10 text-dashboard-accent1 border-dashboard-accent1"
        >
          {collectors?.length || 0} Collectors
        </Badge>
      </div>

      <Card className="overflow-hidden bg-dashboard-card border-dashboard-cardBorder hover:border-dashboard-cardBorderHover transition-all duration-300">
        <div className="overflow-x-auto">
          <Table>
            <CollectorRolesHeader />
            <TableBody>
              {collectors.map((collector: CollectorInfo) => (
                <CollectorRolesRow
                  key={collector.member_number}
                  collector={collector}
                  onRoleChange={handleRoleChange}
                  onSync={handleSync}
                  permissions={permissions}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default CollectorRolesList;