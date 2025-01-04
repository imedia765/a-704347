import { formatDistanceToNow } from 'date-fns';
import { Member } from "@/types/member";
import { CreditCard, Calendar, Receipt, AlertTriangle, Clock, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface FinancialDetailsProps {
  memberProfile: Member;
}

const FinancialDetails = ({ memberProfile }: FinancialDetailsProps) => {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not recorded';
    return `£${amount.toFixed(2)}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No payment date recorded';
    try {
      return `${formatDistanceToNow(new Date(date))} ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 28;
  };

  const getPaymentHistory = () => {
    const history = [];

    // Add regular payment
    if (memberProfile?.payment_date) {
      history.push({
        date: new Date(memberProfile.payment_date),
        type: 'Regular Payment',
        amount: memberProfile.payment_amount,
        status: 'completed',
      });
    }

    // Add yearly payment
    if (memberProfile?.yearly_payment_due_date) {
      history.push({
        date: new Date(memberProfile.yearly_payment_due_date),
        type: 'Yearly Payment',
        amount: memberProfile.yearly_payment_amount,
        status: memberProfile.yearly_payment_status,
      });
    }

    // Add emergency collection if it exists
    if (memberProfile?.emergency_collection_due_date) {
      history.push({
        date: new Date(memberProfile.emergency_collection_due_date),
        type: 'Emergency Collection',
        amount: memberProfile.emergency_collection_amount,
        status: memberProfile.emergency_collection_status,
      });
    }

    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-dashboard-muted text-sm font-medium">Financial Information</p>
        
        {/* Regular Payment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-white/5 p-4 rounded-lg border border-white/10 hover:border-dashboard-accent1/30 transition-all duration-300">
            <h4 className="font-medium text-dashboard-accent2 flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4" />
              Regular Payment Details
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Amount:</span>
                <span className="text-dashboard-text font-medium">
                  {formatCurrency(memberProfile?.payment_amount || null)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Type:</span>
                <span className="text-dashboard-text">
                  {memberProfile?.payment_type || 'Not specified'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Last Payment:</span>
                <span className="text-dashboard-text">
                  {formatDate(memberProfile?.payment_date || null)}
                </span>
              </div>
            </div>
          </div>

          {/* Yearly Payment Information */}
          <div className="space-y-2 bg-white/5 p-4 rounded-lg border border-white/10 hover:border-dashboard-accent1/30 transition-all duration-300">
            <h4 className="font-medium text-dashboard-accent2 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              Yearly Payment
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Amount:</span>
                <span className="text-dashboard-text font-medium">
                  {formatCurrency(memberProfile?.yearly_payment_amount || null)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Due Date:</span>
                <span className="text-dashboard-text">
                  {memberProfile?.yearly_payment_due_date || 'January 28th, 2025'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Status:</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs",
                  memberProfile?.yearly_payment_status === 'paid'
                    ? "bg-dashboard-accent3/20 text-dashboard-accent3"
                    : isOverdue(memberProfile?.yearly_payment_due_date || null)
                      ? "bg-red-500/20 text-red-500"
                      : "bg-dashboard-warning/20 text-dashboard-warning"
                )}>
                  {memberProfile?.yearly_payment_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Timeline */}
        <div className="mt-8 space-y-4">
          <h4 className="text-dashboard-accent2 flex items-center gap-2 font-medium">
            <Clock3 className="w-4 h-4" />
            Payment History
          </h4>
          
          <div className="space-y-4">
            {getPaymentHistory().map((payment, index) => (
              <div key={index} className="relative pl-6 pb-4 border-l border-white/10">
                <div className="absolute left-0 -translate-x-1/2 w-3 h-3 rounded-full bg-dashboard-dark border-2 border-white/10" />
                
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-dashboard-accent2 text-sm font-medium">
                      {payment.type}
                    </span>
                    <span className="text-dashboard-text text-sm">
                      {payment.date.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-dashboard-text font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 text-xs",
                      payment.status === 'paid' || payment.status === 'completed'
                        ? "text-dashboard-accent3"
                        : payment.status === 'pending'
                          ? "text-dashboard-warning"
                          : "text-red-500"
                    )}>
                      {payment.status === 'paid' || payment.status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : payment.status === 'pending' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {payment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Collection Alert - Only show if there's an active collection */}
        {memberProfile?.emergency_collection_amount && (
          <div className="space-y-2">
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Emergency Collection Required
              </AlertDescription>
            </Alert>
            
            <div className="bg-white/5 p-4 rounded-lg border border-red-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Amount Due:</span>
                <span className="text-dashboard-text font-medium">
                  {formatCurrency(memberProfile?.emergency_collection_amount)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Due Date:</span>
                <span className="text-dashboard-text">
                  {memberProfile?.emergency_collection_due_date || 'Not set'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-dashboard-muted">Status:</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs",
                  memberProfile?.emergency_collection_status === 'paid'
                    ? "bg-dashboard-accent3/20 text-dashboard-accent3"
                    : isOverdue(memberProfile?.emergency_collection_due_date || null)
                      ? "bg-red-500/20 text-red-500"
                      : "bg-dashboard-warning/20 text-dashboard-warning"
                )}>
                  {memberProfile?.emergency_collection_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}

        {memberProfile?.payment_notes && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-dashboard-muted text-sm">Notes:</p>
            <p className="text-dashboard-text text-sm mt-1">{memberProfile.payment_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDetails;