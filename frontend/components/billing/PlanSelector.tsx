import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBackend } from "@/hooks/useBackend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Crown, 
  Zap, 
  Shield,
  Loader2
} from "lucide-react";

interface PlanSelectorProps {
  userId: number;
  currentPlan?: string;
  onPlanSelected?: (plan: any) => void;
}

interface PlanDetails {
  id: string;
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly?: number;
    yearly?: number;
  };
  limits: {
    mt5Configs: number;
    apiCallsPerMonth: number;
    supportLevel: string;
  };
}

export function PlanSelector({ userId, currentPlan = "free", onPlanSelected }: PlanSelectorProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => backend.billing.getPlans(),
  });

  const createTrialMutation = useMutation({
    mutationFn: (planId: string) => 
      backend.billing.startTrial({
        userId,
        planId,
        trialDays: 14,
        email: `user${userId}@example.com`,
      }),
    onSuccess: (data) => {
      toast({
        title: "Trial started!",
        description: `Your ${data.trial.trialDays}-day trial has begun.`,
      });
      onPlanSelected?.(data.trial);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start trial",
        variant: "destructive",
      });
    },
  });

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "pro":
        return <Zap className="h-6 w-6" />;
      case "enterprise":
        return <Crown className="h-6 w-6" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };

  const formatPrice = (price?: number, currency = "EUR") => {
    if (!price) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const getYearlyDiscount = (monthly?: number, yearly?: number) => {
    if (!monthly || !yearly) return 0;
    const yearlyMonthly = yearly / 12;
    const discount = ((monthly - yearlyMonthly) / monthly) * 100;
    return Math.round(discount);
  };

  const handlePlanSelection = async (plan: PlanDetails) => {
    if (plan.id === "free") {
      // Handle downgrade to free
      onPlanSelected?.(plan);
      return;
    }

    setSelectedPlan(plan.id);
    
    // For paid plans, start with trial or go to payment
    if (currentPlan === "free") {
      // Start trial for new users
      createTrialMutation.mutate(plan.id);
    } else {
      // Handle upgrade/downgrade for existing subscribers
      onPlanSelected?.(plan);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const plans = plansData?.plans || [];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-600">
          Start with a free trial, then choose the plan that works best for you.
        </p>

        <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-8">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan: PlanDetails) => {
                const isCurrentPlan = plan.id === currentPlan;
                const price = plan.pricing.monthly;
                
                return (
                  <Card key={plan.id} className={`relative ${isCurrentPlan ? "border-primary shadow-lg" : ""}`}>
                    {plan.id === "pro" && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        {getPlanIcon(plan.id)}
                      </div>
                      <CardTitle className="flex items-center justify-center gap-2">
                        {plan.name}
                        {isCurrentPlan && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <div className="text-3xl font-bold">
                          {formatPrice(price)}
                          {price && <span className="text-sm text-gray-500">/month</span>}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4 border-t">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• {plan.limits.mt5Configs === -1 ? "Unlimited" : plan.limits.mt5Configs} MT5 configs</div>
                          <div>• {plan.limits.apiCallsPerMonth === -1 ? "Unlimited" : plan.limits.apiCallsPerMonth.toLocaleString()} API calls/month</div>
                          <div>• {plan.limits.supportLevel} support</div>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={isCurrentPlan || selectedPlan === plan.id || createTrialMutation.isPending}
                        onClick={() => handlePlanSelection(plan)}
                      >
                        {createTrialMutation.isPending && selectedPlan === plan.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isCurrentPlan ? "Current Plan" : 
                         plan.id === "free" ? "Downgrade to Free" :
                         currentPlan === "free" ? "Start Free Trial" : "Select Plan"}
                      </Button>

                      {plan.id !== "free" && currentPlan === "free" && (
                        <p className="text-xs text-center text-gray-500">
                          14-day free trial • No credit card required
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="mt-8">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan: PlanDetails) => {
                const isCurrentPlan = plan.id === currentPlan;
                const price = plan.pricing.yearly;
                const monthlyPrice = plan.pricing.monthly;
                const discount = getYearlyDiscount(monthlyPrice, price);
                
                return (
                  <Card key={plan.id} className={`relative ${isCurrentPlan ? "border-primary shadow-lg" : ""}`}>
                    {plan.id === "pro" && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        {getPlanIcon(plan.id)}
                      </div>
                      <CardTitle className="flex items-center justify-center gap-2">
                        {plan.name}
                        {isCurrentPlan && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <div className="text-3xl font-bold">
                          {formatPrice(price)}
                          {price && <span className="text-sm text-gray-500">/year</span>}
                        </div>
                        {price && monthlyPrice && (
                          <div className="text-sm text-gray-500">
                            {formatPrice(Math.round(price / 12))}/month • Save {discount}%
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4 border-t">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• {plan.limits.mt5Configs === -1 ? "Unlimited" : plan.limits.mt5Configs} MT5 configs</div>
                          <div>• {plan.limits.apiCallsPerMonth === -1 ? "Unlimited" : plan.limits.apiCallsPerMonth.toLocaleString()} API calls/month</div>
                          <div>• {plan.limits.supportLevel} support</div>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={isCurrentPlan || selectedPlan === plan.id || createTrialMutation.isPending}
                        onClick={() => handlePlanSelection(plan)}
                      >
                        {createTrialMutation.isPending && selectedPlan === plan.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isCurrentPlan ? "Current Plan" : 
                         plan.id === "free" ? "Downgrade to Free" :
                         currentPlan === "free" ? "Start Free Trial" : "Select Plan"}
                      </Button>

                      {plan.id !== "free" && currentPlan === "free" && (
                        <p className="text-xs text-center text-gray-500">
                          14-day free trial • No credit card required
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}