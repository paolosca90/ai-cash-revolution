import { BillingDashboard } from "@/components/billing/BillingDashboard";

export default function Billing() {
  // For now, using a demo user ID. In a real app, this would come from your auth context
  const userId = 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and billing history.</p>
      </div>

      <BillingDashboard userId={userId} />
    </div>
  );
}
