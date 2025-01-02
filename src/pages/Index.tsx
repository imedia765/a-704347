import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Tables } from '@/integrations/supabase/types';
import MemberSearch from '@/components/MemberSearch';
import MembersList from '@/components/MembersList';
import SidePanel from '@/components/SidePanel';
import TotalCount from '@/components/TotalCount';
import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const { data: membersData } = useQuery({
    queryKey: ['members_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      
      return { totalCount: count || 0 };
    },
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-medium mb-2">Dashboard</h1>
                <p className="text-dashboard-muted">Welcome back!</p>
              </div>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </header>
            
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-medium">{profile?.full_name}</h3>
                      <div className="text-sm text-muted-foreground">
                        <p>Member Number: {profile?.member_number}</p>
                        <p>Email: {profile?.email}</p>
                        <p>Phone: {profile?.phone || 'Not provided'}</p>
                        <p>Membership Type: {profile?.membership_type || 'Standard'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 'users':
        return (
          <>
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-medium mb-2">Members</h1>
                <p className="text-dashboard-muted">View and manage member information</p>
              </div>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </header>
            <TotalCount 
              items={[{
                count: membersData?.totalCount || 0,
                label: "Total Members",
                icon: <Users className="w-6 h-6 text-blue-400" />
              }]}
            />
            <MemberSearch 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <MembersList searchTerm={searchTerm} />
          </>
        );
      case 'settings':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2">Settings</h1>
              <p className="text-dashboard-muted">Configure your application settings</p>
            </header>
            <div className="dashboard-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-gray-400">Toggle dark mode</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <SidePanel onTabChange={setActiveTab} />
      <div className="pl-64">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;