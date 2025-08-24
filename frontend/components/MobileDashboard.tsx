import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import StatCard from "./cards/StatCard";
import AutoSignalCard from "./cards/AutoSignalCard";
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  BarChart, 
  Brain, 
  Target, 
  Activity, 
  AlertCircle, 
  Award, 
  Shield, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileDashboardProps {
  // Props for the mobile dashboard
}

const MobileDashboard: React.FC<MobileDashboardProps> = () => {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Data fetching hooks (same as desktop)
  const { data: topSignalsData, isLoading: isLoadingTopSignals, error: topSignalsError, refetch: refetchTopSignals } = useQuery({
    queryKey: ["topSignals"],
    queryFn: () => backend.analysis.getTopSignals(),
    refetchInterval: 30000,
    retry: 2,
    staleTime: 15000,
  });

  const { data: performanceData, isLoading: isLoadingPerformance, error: performanceError } = useQuery({
    queryKey: ["performance"],
    queryFn: () => backend.analysis.getPerformance(),
    retry: 1,
    refetchInterval: 30000,
  });

  const { data: signalStats, isLoading: isLoadingSignalStats, refetch: refetchSignalStats } = useQuery({
    queryKey: ["signalStats"],
    queryFn: () => backend.analysis.getSignalStats(),
    refetchInterval: 20000,
    retry: 2,
    staleTime: 10000,
  });

  // Mobile-optimized stats array
  const mobileStats = [
    { 
      title: "Balance", 
      value: showBalance ? `$${performanceData?.totalProfitLoss?.toFixed(2) || "0.00"}` : "••••••", 
      icon: DollarSign, 
      description: "Total P&L",
      color: (performanceData?.totalProfitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
    },
    { 
      title: "Win Rate", 
      value: `${performanceData?.winRate?.toFixed(1) || 0}%`, 
      icon: Target, 
      description: "Success Rate",
      color: (performanceData?.winRate || 0) >= 70 ? "text-green-600" : "text-yellow-600"
    },
    { 
      title: "Best Trade", 
      value: `$${performanceData?.bestTrade?.toFixed(2) || 0}`, 
      icon: TrendingUp, 
      description: "Highest Profit",
      color: "text-green-600"
    },
    { 
      title: "Active Signals", 
      value: `${topSignalsData?.signals?.length || 0}`, 
      icon: Zap, 
      description: "Live Opportunities",
      color: "text-blue-600"
    }
  ];

  // Swipe gesture handling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const cardWidth = container.offsetWidth;
    const newIndex = Math.round(container.scrollLeft / cardWidth);
    setCurrentCardIndex(newIndex);
  };

  // Navigation methods
  const navigateToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      });
    }
    setCurrentCardIndex(index);
  };

  const goToPrevCard = () => {
    const newIndex = Math.max(0, currentCardIndex - 1);
    navigateToCard(newIndex);
  };

  const goToNextCard = () => {
    const newIndex = Math.min(mobileStats.length - 1, currentCardIndex + 1);
    navigateToCard(newIndex);
  };

  const handleQuickAction = (action: string) => {
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    switch (action) {
      case 'trade':
        navigate('/trade');
        break;
      case 'signals':
        // Scroll to signals section
        const signalsSection = document.getElementById('mobile-signals');
        if (signalsSection) {
          signalsSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'refresh':
        refetchTopSignals();
        refetchSignalStats();
        toast({ title: "🔄 Refreshing data..." });
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4 md:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">AI Trading System</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBalance(!showBalance)}
          className="h-8 w-8 p-0"
        >
          {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      {/* Swipeable Stats Cards */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-scroll snap-x snap-mandatory scrollbar-hide smooth-scroll"
          onScroll={handleScroll}
        >
          {mobileStats.map((stat, index) => (
            <div key={stat.title} className="w-full flex-shrink-0 snap-start pr-4 last:pr-0">
              <Card className="mobile-card h-24">
                <CardContent className="p-4 h-full flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-muted-foreground/60" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Swipe Navigation */}
        <div className="flex justify-between items-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevCard}
            disabled={currentCardIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex gap-1">
            {mobileStats.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentCardIndex ? "bg-primary" : "bg-muted-foreground/30"
                )}
                onClick={() => navigateToCard(index)}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextCard}
            disabled={currentCardIndex === mobileStats.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={() => handleQuickAction('trade')}
          className="touch-target h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Zap className="h-5 w-5 mr-2" />
          Trade
        </Button>
        <Button
          onClick={() => handleQuickAction('signals')}
          variant="outline"
          className="touch-target h-12"
        >
          <Target className="h-5 w-5 mr-2" />
          Signals
        </Button>
        <Button
          onClick={() => handleQuickAction('refresh')}
          variant="outline"
          className="touch-target h-12"
          disabled={isLoadingTopSignals}
        >
          <RefreshCw className={cn("h-5 w-5 mr-2", isLoadingTopSignals && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Live Signals Section */}
      <div id="mobile-signals" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Live Signals</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {topSignalsData?.signals?.length || 0} Active
          </Badge>
        </div>

        {isLoadingTopSignals ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="h-32">
                <CardContent className="p-4 h-full flex items-center">
                  <div className="w-full space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : topSignalsError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 text-sm">Error loading signals</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => handleQuickAction('refresh')}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : !topSignalsData?.signals || topSignalsData.signals.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground text-sm mb-3">
                No signals available right now
              </p>
              <Button 
                onClick={() => handleQuickAction('refresh')}
                size="sm"
                variant="outline"
              >
                Generate New Signals
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topSignalsData.signals.slice(0, 3).map((signal, index) => (
              <AutoSignalCard key={`${signal.symbol}-${index}`} signal={signal as any} />
            ))}
            {topSignalsData.signals.length > 3 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/trade')}
              >
                View All {topSignalsData.signals.length} Signals
              </Button>
            )}
          </div>
        )}
      </div>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium text-sm">System Active</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI monitoring 20+ markets • Last update: {signalStats?.lastGenerationTime ? 
              new Date(signalStats.lastGenerationTime).toLocaleTimeString() : 
              'Just now'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDashboard;