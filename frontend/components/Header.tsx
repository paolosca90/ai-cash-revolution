import React, { useState, useEffect } from "react";
import { Menu, Wifi, WifiOff, Bell, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import Nav from "./Nav";
import { cn } from "@/lib/utils";

// Hook to detect online status
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Hook for PWA install prompt
const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handlePWAInstallable = () => {
      setIsInstallable(true);
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
      }
    }
  };

  return { isInstallable, installPWA };
};

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const isOnline = useOnlineStatus();
  const { isInstallable, installPWA } = usePWAInstall();

  // Show install banner after a delay
  useEffect(() => {
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstallClick = () => {
    installPWA();
    setShowInstallBanner(false);
  };

  return (
    <>
      {/* PWA Install Banner */}
      {showInstallBanner && isInstallable && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between gap-3 md:hidden">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Download className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">Install AI Trading App</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={handleInstallClick}
            >
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-white/20 text-white"
              onClick={() => setShowInstallBanner(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className={cn(
        "flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        // Mobile header height
        "h-12 px-3 py-2",
        // Desktop header height
        "md:h-14 md:px-4 lg:h-[60px] lg:px-6",
        // Sticky positioning
        "sticky top-0 z-40"
      )}>
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="shrink-0 md:hidden h-8 w-8 p-0"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-[280px] p-0">
            <div className="flex h-14 items-center border-b px-4">
              <a href="/dashboard" className="flex items-center gap-2 font-semibold">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-6 w-6"
                >
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                <span>AI Trading Boost</span>
              </a>
            </div>
            <div className="flex-1 py-2">
              <Nav />
            </div>
          </SheetContent>
        </Sheet>

        {/* App Title/Logo - Mobile */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate md:hidden">AI Trading</h1>
          
          {/* Desktop can add breadcrumbs or other content here */}
          <div className="hidden md:block flex-1">
            {/* Desktop header content */}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <div className="flex items-center gap-1">
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-500 hidden sm:inline">Offline</span>
              </div>
            )}
          </div>

          {/* Notifications Button - Mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 relative md:hidden"
          >
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
            >
              2
            </Badge>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* PWA Install Button - Desktop */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2 h-8"
              onClick={handleInstallClick}
            >
              <Download className="h-3 w-3" />
              <span className="text-xs">Install App</span>
            </Button>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
