import { useState } from 'react';
import { GitBranch, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const GitOperationsCard = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [githubToken, setGithubToken] = useState('');

  const handlePushToMaster = async () => {
    if (!githubToken) {
      toast({
        title: "Token Required",
        description: "Please enter your GitHub Personal Access Token",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('git-operations', {
        body: {
          token: githubToken,
          branch: 'main',
          commitMessage: 'Force commit: Pushing all files to master'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully pushed changes to master",
      });

      setGithubToken(''); // Clear token for security
    } catch (error) {
      console.error('Push error:', error);
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-dashboard-card border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-dashboard-accent1" />
            <CardTitle className="text-xl text-white">Git Operations</CardTitle>
          </div>
        </div>
        <CardDescription className="text-dashboard-muted">
          Manage Git operations and repository synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-dashboard-card/50 border-dashboard-accent1/20">
          <AlertCircle className="h-4 w-4 text-dashboard-accent1" />
          <AlertTitle className="text-dashboard-accent1">Important</AlertTitle>
          <AlertDescription className="text-dashboard-muted">
            You need a GitHub Personal Access Token with repo access to perform this operation.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Enter GitHub Token"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            className="bg-dashboard-card/50 border-white/10 text-white"
          />
          
          <Button
            onClick={handlePushToMaster}
            disabled={isProcessing || !githubToken}
            className="w-full bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
          >
            {isProcessing ? "Processing..." : "Push to Master"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GitOperationsCard;