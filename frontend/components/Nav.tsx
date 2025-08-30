import { NavLink, useNavigate } from "react-router-dom";
import { Home, CandlestickChart, History, Settings, CreditCard, Brain, BookOpen, Newspaper, LogOut, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface NavProps {
  onLogout?: () => void;
}

const Nav: React.FC<NavProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
    } else {
      // Fallback for older logout logic
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }
  };
  
  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/ml", icon: Brain, label: "ML Analytics", badge: "AI" },
    { to: "/trade", icon: CandlestickChart, label: "Trading" },
    { to: "/news", icon: Newspaper, label: "News" },
    { to: "/history", icon: History, label: "Storico" },
    { to: "/guides", icon: BookOpen, label: "Guide", badge: "NEW" },
    { to: "/downloads", icon: Download, label: "Download MT5", badge: "SETUP" },
    { to: "/settings", icon: Settings, label: "Impostazioni" },
    { to: "/billing", icon: CreditCard, label: "Abbonamento" },
  ];

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
              isActive ? "bg-muted text-primary" : "text-muted-foreground"
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </NavLink>
      ))}
      
      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-primary"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </nav>
  );
}

export default Nav;
