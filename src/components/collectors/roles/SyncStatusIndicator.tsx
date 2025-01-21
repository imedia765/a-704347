import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncStatusIndicatorProps {
  status?: {
    status?: string;
    store_status?: string;
    last_attempted_sync_at?: string;
    store_error?: string | null;
  } | null;
}

export const SyncStatusIndicator = ({ status }: SyncStatusIndicatorProps) => {
  return (
    <div className="space-y-2">
      <Badge variant={status?.status === 'completed' ? 'default' : 'secondary'}>
        {status?.status || 'Not synced'}
      </Badge>
      {status?.store_error && (
        <div className="text-sm text-red-500">
          Error: {status.store_error}
        </div>
      )}
    </div>
  );
};