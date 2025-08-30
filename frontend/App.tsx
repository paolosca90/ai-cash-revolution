import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";

import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Subscribe from "./pages/Subscribe";
import MT5Setup from "./pages/MT5Setup";
import Dashboard from "./pages/Dashboard";
import MLDashboard from "./pages/MLDashboard";
import Trade from "./pages/Trade";
import News from "./pages/News";
import History from "./pages/History";
import Guides from "./pages/Guides";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Downloads from "./pages/Downloads";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const verifyToken = async (token: string) => {
    try {
      // Handle demo tokens for development/testing
      if (token.startsWith('demo-')) {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          return true; // Demo token with user data is valid
        }
        return false;
      }

      const response = await fetch('https://backend-c10yefh44-paolos-projects-dc6990da.vercel.app/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update user data in localStorage
        localStorage.setItem("user_data", JSON.stringify(data.user));
        return true;
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't remove demo tokens on network errors
      if (!token.startsWith('demo-')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
      return token.startsWith('demo-'); // Allow demo tokens to work offline
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
  };
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        const isValid = await verifyToken(token);
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
      
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {!isAuthenticated ? (
          // Public Routes (No Layout)
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        ) : (
          // Protected Routes (With Layout)
          <Layout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ml" element={<MLDashboard />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="/news" element={<News />} />
              <Route path="/history" element={<History />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/mt5-setup" element={<MT5Setup />} />
              <Route path="/logout" element={<Landing />} />
            </Routes>
          </Layout>
        )}
        <Toaster />
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
