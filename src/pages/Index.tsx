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
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const { data: memberProfile, isError } = useQuery({
    queryKey: ['memberProfile'],
    queryFn: async () => {
      console.log('Fetching member profile...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching member profile",
          description: error.message
        });
        throw error;
      }
      
      if (!data) {
        toast({
          variant: "destructive",
          title: "Profile not found",
          description: "Please contact an administrator to set up your profile."
        });
      }
      
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
                <h1 className="text-3xl font-medium mb-2 text-white">Dashboard</h1>
                <p className="text-gray-400">Welcome back!</p>
              </div>
              <Button onClick={handleLogout} variant="outline" className="border-white/10 hover:bg-white/5">
                Logout
              </Button>
            </header>
            
            <div className="grid gap-6">
              {!memberProfile ? (
                <Card className="bg-dashboard-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Not Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      Your profile has not been set up yet. Please contact an administrator.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-dashboard-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Member Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 border-2 border-white/10">
                        <AvatarFallback className="bg-dashboard-accent1 text-lg">
                          {memberProfile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-xl font-medium text-white">{memberProfile?.full_name}</h3>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-400">Member #{memberProfile?.member_number}</p>
                          <p className="text-gray-400">Email: {memberProfile?.email || 'Not provided'}</p>
                          <p className="text-gray-400">Phone: {memberProfile?.phone || 'Not provided'}</p>
                          <p className="text-gray-400">Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            memberProfile?.status === 'active' 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {memberProfile?.status || 'Pending'}
                          </span></p>
                          <p className="text-gray-400">Membership Type: {memberProfile?.membership_type || 'Standard'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
    <div className="min-h-screen bg-dashboard-background">
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