import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "@/hooks/useBackend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  Download, 
  CreditCard, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { PlanSelector } from "./PlanSelector";
import { PaymentMethodList } from "./PaymentMethodList";
import { PaymentMethodForm } from "./PaymentMethodForm";
import { GDPRCompliance } from "./GDPRCompliance";
import { StripeProvider } from "./StripeProvider";

interface BillingDashboardProps {
  userId: number;
}

interface Subscription {
  id: number;
  plan: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
}

interface Invoice {
  id: number;
  stripeInvoiceId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate?: string;
  paidAt?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  createdAt: string;
}

export function BillingDashboard({ userId }: BillingDashboardProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: () => backend.billing.getSubscription({ userId }),
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", userId],
    queryFn: () => backend.billing.getInvoices({ userId, limit: 10 }),
  });

  const { data: trialStatus } = useQuery({
    queryKey: ["trialStatus", userId],
    queryFn: () => backend.billing.getTrialStatus({ userId }),
  });

  const currentSubscription = subscription?.subscription;
  const currentTrial = trialStatus?.trial;

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case "trialing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      case "cancelled":
      case "canceled":
        return <Badge variant="outline">Cancelled</Badge>;
      case "paid":
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case "open":
        return <Badge variant="secondary">Pending</Badge>;
      case "void":
        return <Badge variant="outline">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCurrentPeriodInfo = () => {
    if (currentTrial && currentTrial.status === "active") {
      const daysLeft = Math.ceil(
        (new Date(currentTrial.trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        type: "trial",
        text: `${daysLeft} days left in trial`,
        endDate: currentTrial.trialEnd,
        isExpiringSoon: daysLeft <= 3,
      };
    }

    if (currentSubscription?.currentPeriodEnd) {
      const endDate = new Date(currentSubscription.currentPeriodEnd);
      const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return {
        type: "subscription",
        text: `Renews on ${formatDate(currentSubscription.currentPeriodEnd)}`,
        endDate: currentSubscription.currentPeriodEnd,
        isExpiringSoon: false,
      };
    }

    return null;
  };

  const periodInfo = getCurrentPeriodInfo();

  return (
    <StripeProvider>
      <div className="space-y-6">
        {/* Subscription Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : currentSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold capitalize">
                      {currentSubscription.plan} Plan
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(currentSubscription.status)}
                      {periodInfo && (
                        <span className={`text-sm flex items-center gap-1 ${
                          periodInfo.isExpiringSoon ? "text-orange-600" : "text-gray-600"
                        }`}>
                          <Clock className="h-4 w-4" />
                          {periodInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {currentSubscription.cancelAtPeriodEnd && (
                      <div className="text-sm text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Cancelled - ends {formatDate(currentSubscription.currentPeriodEnd)}
                      </div>
                    )}
                  </div>
                </div>

                {periodInfo?.isExpiringSoon && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-800">Trial ending soon</p>
                        <p className="text-sm text-orange-700">
                          Your trial ends in {periodInfo.text.split(' ')[0]} days. 
                          Add a payment method to continue using premium features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600">No active subscription</p>
                <p className="text-sm text-gray-500 mt-1">You're currently on the free plan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="plan">Plans</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="billing-history">Billing History</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-6">
            <PlanSelector 
              userId={userId} 
              currentPlan={currentSubscription?.plan || "free"}
              onPlanSelected={(plan) => {
                toast({
                  title: "Plan updated",
                  description: `Successfully switched to ${plan.name || plan.id} plan`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Payment Methods</h3>
                <p className="text-sm text-gray-600">
                  Manage your payment methods and billing information
                </p>
              </div>
              <Button onClick={() => setShowAddPaymentMethod(!showAddPaymentMethod)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>

            {showAddPaymentMethod && (
              <PaymentMethodForm
                userId={userId}
                onSuccess={() => {
                  setShowAddPaymentMethod(false);
                  toast({
                    title: "Payment method added",
                    description: "Your payment method has been successfully added.",
                  });
                }}
                showTitle={false}
              />
            )}

            <PaymentMethodList userId={userId} />
          </TabsContent>

          <TabsContent value="billing-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View and download your invoices and payment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : invoices?.invoices?.length ? (
                  <div className="space-y-4">
                    {invoices.invoices.map((invoice: Invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Invoice #{invoice.stripeInvoiceId.slice(-8)}
                            </span>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-x-4">
                            <span>{formatDate(invoice.createdAt)}</span>
                            {invoice.periodStart && invoice.periodEnd && (
                              <span>
                                Service: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-semibold">
                            {formatCurrency(invoice.amountDue, invoice.currency)}
                          </div>
                          <div className="flex items-center gap-2">
                            {invoice.hostedInvoiceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(invoice.hostedInvoiceUrl, "_blank")}
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                View
                              </Button>
                            )}
                            {invoice.invoicePdf && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(invoice.invoicePdf, "_blank")}
                              >
                                <Download className="mr-1 h-3 w-3" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No billing history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan Usage</CardTitle>
                <CardDescription>
                  Monitor your usage against plan limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">MT5 Configurations</span>
                      <span className="text-sm text-gray-600">
                        1 / {currentSubscription?.plan === "free" ? "1" : 
                             currentSubscription?.plan === "pro" ? "5" : "unlimited"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: currentSubscription?.plan === "free" ? "100%" : "20%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">API Calls This Month</span>
                      <span className="text-sm text-gray-600">
                        247 / {currentSubscription?.plan === "free" ? "1,000" : 
                               currentSubscription?.plan === "pro" ? "10,000" : "unlimited"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: "24.7%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Support Level:</span>
                        <p className="font-medium capitalize">
                          {currentSubscription?.plan === "free" ? "Standard" :
                           currentSubscription?.plan === "pro" ? "Priority" : "Dedicated"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Period:</span>
                        <p className="font-medium">
                          {formatDate(currentSubscription?.currentPeriodStart)} - {formatDate(currentSubscription?.currentPeriodEnd)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <GDPRCompliance 
              userId={userId} 
              userEmail={`user${userId}@example.com`} // Replace with actual user email
            />
          </TabsContent>
        </Tabs>
      </div>
    </StripeProvider>
  );
}