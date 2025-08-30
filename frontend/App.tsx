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
  
  useEffect(() => {
    // Check if user is authenticated - simple check for production demo
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

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
          <Layout>
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
