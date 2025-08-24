import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Crown, Settings, CreditCard, Shield, User, TrendingUp, 
  Zap, Database, Clock, Star, Award, ChevronRight,
  AlertCircle, Check, Plus, Edit, Trash2, Activity,
  DollarSign, BarChart3, Brain, Target
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// User data from localStorage
const getUserData = () => {
  try {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

// Subscription benefits configuration
const SUBSCRIPTION_BENEFITS = {
  FREE: {
    name: "Free Trial",
    color: "bg-gray-100 text-gray-800",
    features: [
      "10 AI signals per day",
      "1 trading account",
      "Manual trading only",
      "Basic analytics"
    ],
    limitations: [
      "Limited signals",
      "No auto-trading",
      "Email support only"
    ]
  },
  BASIC: {
    name: "Basic Plan",
    color: "bg-blue-100 text-blue-800",
    features: [
      "50 AI signals per day",
      "2 trading accounts",
      "Auto-trading enabled",
      "Email alerts",
      "Full trading history"
    ],
    limitations: [
      "Standard support",
      "Basic ML analytics"
    ]
  },
  PREMIUM: {
    name: "Premium Plan",
    color: "bg-purple-100 text-purple-800",
    features: [
      "200 AI signals per day",
      "5 trading accounts",
      "Advanced ML analytics",
      "Custom strategies",
      "Priority support",
      "Real-time notifications"
    ],
    limitations: [
      "No white-label access"
    ]
  },
  ENTERPRISE: {
    name: "Enterprise Plan",
    color: "bg-gold-100 text-gold-800",
    features: [
      "Unlimited signals",
      "10 trading accounts",
      "White-label access",
      "API access",
      "Dedicated support",
      "Custom integrations"
    ],
    limitations: []
  }
};

export default function ClientArea() {
  const navigate = useNavigate();
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(getUserData());
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token || !user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  // Get user profile data
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: () => backend.user.getUserProfile({ userId: user?.id }),
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  // Get trading accounts
  const { data: tradingAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["tradingAccounts", user?.id],
    queryFn: () => backend.user.getTradingAccounts({ userId: user?.id }),
    enabled: !!user?.id
  });

  // Get subscription plans
  const { data: subscriptionPlans } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: () => backend.user.getSubscriptionPlans()
  });

  // Upgrade subscription mutation
  const upgradeMutation = useMutation({
    mutationFn: (tier: string) => backend.user.upgradeSubscription({ 
      userId: user?.id, 
      tier 
    }),
    onSuccess: (data, tier) => {
      toast({
        title: "🎉 Subscription Upgraded!",
        description: `Successfully upgraded to ${tier} plan`
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      // Update local user data
      const updatedUser = { ...user, subscriptionTier: tier, subscriptionStatus: "ACTIVE" };
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: error.message
      });
    }
  });

  if (!user) {
    return null; // Will redirect to login
  }

  const currentProfile = userProfile?.user || user;
  const subscription = SUBSCRIPTION_BENEFITS[currentProfile.subscriptionTier as keyof typeof SUBSCRIPTION_BENEFITS];
  const accounts = tradingAccounts?.accounts || [];

  // Calculate trial days remaining
  const getTrialDaysRemaining = () => {
    if (currentProfile.subscriptionStatus !== "TRIAL" || !currentProfile.trialEndDate) {
      return 0;
    }
    const now = new Date();
    const trialEnd = new Date(currentProfile.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isTrialExpired = currentProfile.subscriptionStatus === "EXPIRED";
  const isOnTrial = currentProfile.subscriptionStatus === "TRIAL";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
            <p className="text-gray-600">Manage your AI Trading Boost account</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={subscription.color}>
              <Crown className="w-3 h-3 mr-1" />
              {subscription.name}
            </Badge>
            {isOnTrial && (
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                <Clock className="w-3 h-3 mr-1" />
                {trialDaysRemaining} days left
              </Badge>
            )}
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Trading Dashboard
            </Button>
          </div>
        </div>

        {/* Trial/Expiration Alerts */}
        {isTrialExpired && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Your trial has expired.</strong> Upgrade to continue using AI Trading Boost.
              <Button 
                className="ml-3" 
                size="sm"
                onClick={() => setActiveTab("subscription")}
              >
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isOnTrial && trialDaysRemaining <= 3 && (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Trial ending soon!</strong> Only {trialDaysRemaining} days remaining. 
              Upgrade to keep your trading advantages.
              <Button 
                className="ml-3" 
                size="sm" 
                variant="outline"
                onClick={() => setActiveTab("subscription")}
              >
                View Plans
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Subscription</span>
                    <Badge className={subscription.color}>{subscription.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge variant={isTrialExpired ? "destructive" : "default"}>
                      {currentProfile.subscriptionStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Member Since</span>
                    <span className="text-sm text-gray-600">
                      {new Date(currentProfile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {isOnTrial && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Trial Progress</span>
                        <span>{7 - trialDaysRemaining}/7 days used</span>
                      </div>
                      <Progress 
                        value={((7 - trialDaysRemaining) / 7) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trading Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Trading Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Connected Accounts</span>
                    <span className="font-semibold">
                      {accounts.length}/{currentProfile.maxTradingAccounts}
                    </span>
                  </div>
                  <Progress 
                    value={(accounts.length / currentProfile.maxTradingAccounts) * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Accounts</span>
                    <span>{accounts.filter((acc: any) => acc.isActive).length}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setActiveTab("accounts")}
                  >
                    Manage Accounts
                  </Button>
                </CardContent>
              </Card>

              {/* Usage Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Usage Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">42</div>
                      <div className="text-xs text-gray-600">Signals Today</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">87%</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600 mb-1">Daily Signal Limit</div>
                    <Progress value={75} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">42/50 signals used</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Current Features</CardTitle>
                <p className="text-sm text-gray-600">
                  Features included in your {subscription.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">✅ Included Features</h4>
                    <ul className="space-y-2">
                      {subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {subscription.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-700">⏳ Upgrade for More</h4>
                      <ul className="space-y-2">
                        {subscription.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-gray-600">Select the perfect plan for your trading needs</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {subscriptionPlans?.plans && Object.entries(subscriptionPlans.plans).map(([tier, plan]: [string, any]) => (
                <Card 
                  key={tier} 
                  className={`relative ${currentProfile.subscriptionTier === tier ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {tier === "PREMIUM" && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      {tier === "FREE" && <Award className="w-5 h-5 text-gray-500" />}
                      {tier === "BASIC" && <Target className="w-5 h-5 text-blue-500" />}
                      {tier === "PREMIUM" && <Brain className="w-5 h-5 text-purple-500" />}
                      {tier === "ENTERPRISE" && <Crown className="w-5 h-5 text-yellow-500" />}
                      {plan.name}
                    </CardTitle>
                    {plan.price && (
                      <div className="text-3xl font-bold">
                        ${plan.price}
                        <span className="text-base font-normal text-gray-600">/month</span>
                      </div>
                    )}
                    {tier === "FREE" && (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="text-center text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      {plan.signalsPerDay} signals/day
                    </div>
                    
                    <div className="text-center text-sm text-gray-600">
                      <Database className="w-4 h-4 inline mr-1" />
                      {plan.maxTradingAccounts} trading accounts
                    </div>
                    
                    {currentProfile.subscriptionTier === tier ? (
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : currentProfile.subscriptionTier === "FREE" || 
                        (tier !== "FREE" && 
                         Object.keys(subscriptionPlans.plans).indexOf(tier) > 
                         Object.keys(subscriptionPlans.plans).indexOf(currentProfile.subscriptionTier)) ? (
                      <Button 
                        className="w-full" 
                        onClick={() => upgradeMutation.mutate(tier)}
                        disabled={upgradeMutation.isPending}
                      >
                        {tier === "FREE" ? "Start Free Trial" : "Upgrade Now"}
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="w-full">
                        Downgrade Available
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Trading Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Trading Accounts</h2>
                <p className="text-gray-600">
                  Manage your connected trading accounts ({accounts.length}/{currentProfile.maxTradingAccounts})
                </p>
              </div>
              {accounts.length < currentProfile.maxTradingAccounts && (
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => navigate("/add-trading-account")}
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </Button>
              )}
            </div>

            {accounts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Trading Accounts Connected</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your first trading account to start automated trading
                  </p>
                  <Button onClick={() => navigate("/add-trading-account")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Trading Account
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {accounts.map((account: any) => (
                  <Card key={account.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {account.accountType === "MT5" && "📈"}
                            {account.accountType === "BINANCE" && "🟡"}
                            {account.accountType === "BYBIT" && "🔶"}
                          </div>
                          <div>
                            <h4 className="font-semibold">{account.accountName}</h4>
                            <p className="text-sm text-gray-600">{account.brokerName} • {account.accountType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={account.isConnected ? "default" : "secondary"}>
                            {account.isConnected ? "Connected" : "Disconnected"}
                          </Badge>
                          {account.autoTradingEnabled && (
                            <Badge className="bg-green-100 text-green-800">
                              Auto-Trading
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Balance</div>
                          <div className="font-semibold">
                            {account.currency} {account.accountBalance?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Equity</div>
                          <div className="font-semibold">
                            {account.currency} {account.equity?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Leverage</div>
                          <div className="font-semibold">1:{account.leverage || 100}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Risk per Trade</div>
                          <div className="font-semibold">{account.maxRiskPerTrade}%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Test Connection
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Billing Integration Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    We're working on integrating Stripe for seamless payments
                  </p>
                  <Button variant="outline" disabled>
                    Payment Methods
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}