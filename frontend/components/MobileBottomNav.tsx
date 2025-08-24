import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  CandlestickChart, 
  History, 
  Settings, 
  CreditCard, 
  Brain, 
  BookOpen, 
  Newspaper,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  isMain?: boolean;
}

const primaryNavItems: NavItem[] = [
  { to: "/dashboard", icon: Home, label: "Home", isMain: true },
  { to: "/trade", icon: CandlestickChart, label: "Trade", isMain: true },
  { to: "/ml", icon: Brain, label: "AI", badge: "ML", isMain: true },
  { to: "/history", icon: History, label: "History", isMain: true },
];

const secondaryNavItems: NavItem[] = [
  { to: "/news", icon: Newspaper, label: "News" },
  { to: "/guides", icon: BookOpen, label: "Guides", badge: "NEW" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/billing", icon: CreditCard, label: "Billing" },
];

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [showMore, setShowMore] = React.useState(false);
  
  // Check if we're on a primary route
  const isMainRoute = primaryNavItems.some(item => 
    item.to === location.pathname || 
    (item.to === "/dashboard" && location.pathname === "/")
  );

  const handleMoreToggle = () => {
    setShowMore(!showMore);
  };

  const navItems = showMore ? [...primaryNavItems.slice(0, 3), ...secondaryNavItems] : primaryNavItems;

  return (
    <>
      {/* Overlay when more menu is open */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
          {navItems.map((item, index) => {
            const isActive = item.to === location.pathname || 
              (item.to === "/dashboard" && location.pathname === "/");
            
            // Show "More" button for the 4th position when not showing more
            if (!showMore && index === 3) {
              return (
                <Button
                  key="more"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center justify-center min-w-0 px-2 py-1 h-auto gap-1",
                    "text-xs rounded-lg transition-colors",
                    showMore ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                  onClick={handleMoreToggle}
                >
                  <Plus className={cn("h-5 w-5 transition-transform", showMore && "rotate-45")} />
                  <span className="text-xs font-medium">More</span>
                </Button>
              );
            }
            
            // Skip items beyond the first 3 when not showing more
            if (!showMore && index > 2) {
              return null;
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive: linkActive }) => cn(
                  "flex flex-col items-center justify-center min-w-0 px-2 py-1 rounded-lg transition-colors relative",
                  "text-xs",
                  linkActive || isActive
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setShowMore(false)}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 mb-1" />
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 text-xs px-1 py-0 h-4 min-w-4 flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="font-medium truncate max-w-16">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-20 md:hidden" />
    </>
  );
};

export default MobileBottomNav;