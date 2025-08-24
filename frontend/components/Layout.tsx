import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import MobileNotifications from "./MobileNotifications";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

// Hook to detect mobile device
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Hook to detect iOS device
const useIsIOS = () => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  return isIOS;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isIOS = useIsIOS();
  const isLandingPage = location.pathname === "/";
  
  // Add safe area classes for iOS devices
  const safeAreaClasses = isIOS ? "pt-safe pb-safe" : "";
  
  if (isLandingPage) {
    return (
      <div className={cn("min-h-screen bg-background", safeAreaClasses)}>
        <main className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen w-full bg-background",
      // Desktop layout
      "md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]",
      // Mobile layout
      "flex flex-col",
      safeAreaClasses
    )}>
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
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
              <span className="">AI Trading Boost</span>
            </a>
          </div>
          <div className="flex-1">
            <Nav />
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Mobile/Desktop Header */}
        <Header />
        
        {/* Main Content */}
        <main className={cn(
          "flex flex-1 flex-col bg-background",
          // Desktop padding
          "md:gap-4 md:p-4 lg:gap-6 lg:p-6",
          // Mobile padding - reduced for better touch targets
          "gap-3 p-3 pb-20", // pb-20 for bottom nav space
          // Ensure content doesn't go behind mobile UI
          "safe-area-pb"
        )}>
          <div className="w-full max-w-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
      
      {/* Mobile Notifications */}
      <MobileNotifications />
    </div>
  );
};

export default Layout;
