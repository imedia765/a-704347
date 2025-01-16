import { useRoleStore } from '@/store/roleStore';
import { Database } from "@/integrations/supabase/types";

export type UserRole = Database['public']['Enums']['app_role'];
type Permission = keyof ReturnType<typeof useRoleStore>['permissions'];

interface RoleState {
  userRole: UserRole | null;
  userRoles: UserRole[] | null;
  isLoading: boolean;
  error: Error | null;
  permissions: {
    canManageUsers: boolean;
    canCollectPayments: boolean;
    canAccessSystem: boolean;
    canViewAudit: boolean;
    canManageCollectors: boolean;
  };
}

export const useRoleAccess = () => {
  const {
    userRole,
    userRoles,
    isLoading: roleLoading,
    error,
    permissions
  } = useRoleStore() as RoleState;

  const hasRole = (role: UserRole): boolean => {
    return !!userRoles?.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const canAccessTab = (tab: string): boolean => {
    if (!userRoles) return false;

    if (hasRole('admin')) {
      return ['dashboard', 'users', 'collectors', 'audit', 'system', 'financials'].includes(tab);
    }
    
    if (hasRole('collector')) {
      return ['dashboard', 'users'].includes(tab);
    }
    
    if (hasRole('member')) {
      return tab === 'dashboard';
    }

    return false;
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions[permission] || false;
  };

  return {
    userRole,
    userRoles,
    roleLoading,
    error,
    permissions,
    canAccessTab,
    hasRole,
    hasAnyRole,
    hasPermission
  };
};