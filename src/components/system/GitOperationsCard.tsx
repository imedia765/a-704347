import { useState } from 'react';
import { GitBranch, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const GitOperationsCard = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadAndRunScript = async () => {
    try {
      setIsProcessing(true);
      
      // Create a Blob containing the script content
      const scriptContent = `#!/bin/bash

# Variables
REPO_URL="https://github.com/imedia765/s-935078.git"
BRANCH="main"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Success/Failure Handler
handle_status() {
    if [ $? -eq 0 ]; then
        echo "SUCCESS: $1"
    else
        echo "FAILURE: $1"
        exit 1
    fi
}

# Step 0: Check if Git is installed
if ! command_exists git; then
    echo "Error: Git is not installed. Please install Git to use this script."
    exit 1
else
    echo "SUCCESS: Git is installed."
fi

# Step 1: Check if this is a Git repository
if [ ! -d ".git" ]; then
    echo "This directory is not a Git repository. Initializing a new Git repository..."
    git init
    handle_status "Git repository initialized."
else
    echo "SUCCESS: This is a valid Git repository."
fi

# Step 2: Check if remote is set
echo "Checking if remote 'origin' is set..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null)

if [ "$REMOTE_URL" != "$REPO_URL" ]; then
    echo "Remote 'origin' is not set to the target repository. Setting it now..."
    git remote remove origin 2>/dev/null
    git remote add origin "$REPO_URL"
    handle_status "Remote 'origin' set to $REPO_URL."
else
    echo "SUCCESS: Remote 'origin' is correctly set to $REPO_URL."
fi

# Step 3: Check write access to the repository
echo "Checking write access to $REPO_URL..."
git ls-remote "$REPO_URL" &>/dev/null

if [ $? -ne 0 ]; then
    echo "ERROR: Write access denied to $REPO_URL."
    exit 1
fi
handle_status "Write access to $REPO_URL verified."

# Step 4: Ensure we are on the correct branch
echo "Ensuring we are on the $BRANCH branch..."
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "Switching to $BRANCH branch..."
    git checkout "$BRANCH" 2>/dev/null || {
        echo "Branch $BRANCH does not exist. Creating it now..."
        git checkout -b "$BRANCH"
    }
    handle_status "Switched to $BRANCH branch."
else
    echo "SUCCESS: Already on $BRANCH branch."
fi

# Step 5: Stage all files, including untracked files
echo "Staging all files, including untracked files..."
git add -A
handle_status "All files staged (including untracked files)."

# Step 6: Commit the changes (or forcing commit if no changes)
echo "Committing changes (or forcing commit if no changes)..."
git commit --allow-empty -m "Force commit: Pushing all files to master"
handle_status "Commit created (empty commit if no changes)."

# Step 7: Prompt for GitHub Access Token (if using HTTPS)
if [[ $REPO_URL == https://github.com/* ]]; then
    echo "HTTPS authentication detected."
    echo "Enter your GitHub Personal Access Token (PAT):"
    read -s GITHUB_TOKEN

    if [ -z "$GITHUB_TOKEN" ]; then
        echo "ERROR: No token entered. Exiting."
        exit 1
    fi

    # Update remote URL with token for authentication
    git remote set-url origin https://$GITHUB_TOKEN@github.com/imedia765/s-935078.git
    handle_status "Git remote URL updated for token authentication."
fi

# Step 8: Force push to the master branch
echo "Force pushing all changes to $BRANCH branch of $REPO_URL..."
git push origin "$BRANCH" --force
handle_status "Force pushed to $REPO_URL on branch $BRANCH."

# Final success message
echo "All operations completed successfully!"`;

      const blob = new Blob([scriptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'push_to_master.sh';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Script Downloaded",
        description: "The push_to_master.sh script has been downloaded. Make it executable and run it from your terminal.",
      });
    } catch (error) {
      console.error('Error downloading script:', error);
      toast({
        title: "Download Error",
        description: "Failed to download the script. Please try again.",
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
          <Button
            onClick={downloadAndRunScript}
            disabled={isProcessing}
            className="bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
          >
            Download Push Script
          </Button>
        </div>
        <CardDescription className="text-dashboard-muted">
          Manage Git operations and repository synchronization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-dashboard-card/50 border-dashboard-accent1/20">
          <AlertCircle className="h-4 w-4 text-dashboard-accent1" />
          <AlertTitle className="text-dashboard-accent1">Important</AlertTitle>
          <AlertDescription className="text-dashboard-muted">
            After downloading the script:
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Make it executable: chmod +x push_to_master.sh</li>
              <li>Run it from your terminal: ./push_to_master.sh</li>
              <li>Enter your GitHub token when prompted</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GitOperationsCard;