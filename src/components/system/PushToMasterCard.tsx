import { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PushToMasterCard = () => {
  const { toast } = useToast();
  const [isPushing, setIsPushing] = useState(false);

  const handlePushToMaster = async () => {
    setIsPushing(true);
    try {
      const response = await fetch('/push_to_master.sh');
      if (!response.ok) throw new Error('Failed to fetch script');
      
      const scriptContent = await response.text();
      const blob = new Blob([scriptContent], { type: 'application/x-sh' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'push_to_master.sh';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Script Downloaded",
        description: "The push to master script has been downloaded. Run it in your terminal to push changes.",
      });
    } catch (error) {
      console.error('Error downloading script:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the push to master script.",
        variant: "destructive",
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <Card className="bg-dashboard-card border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-dashboard-accent1" />
            <CardTitle className="text-xl text-white">Push to Master</CardTitle>
          </div>
          <Button
            onClick={handlePushToMaster}
            disabled={isPushing}
            className="bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
          >
            {isPushing ? 'Downloading...' : 'Download Script'}
          </Button>
        </div>
        <CardDescription className="text-dashboard-muted">
          Push your local changes to the master repository
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-dashboard-card/50 border-dashboard-accent1/20">
          <AlertCircle className="h-4 w-4 text-dashboard-accent1" />
          <AlertTitle className="text-dashboard-accent1">Important</AlertTitle>
          <AlertDescription className="text-dashboard-muted">
            This will download a script that you can run in your terminal to push all changes to the master repository.
            Make sure you have Git installed and proper permissions before running the script.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PushToMasterCard;