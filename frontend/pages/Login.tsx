import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, TrendingUp, Lock, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use Supabase authentication
      const { signIn } = await import('@/lib/supabase');
      const authData = await signIn(formData.email, formData.password);

      if (!authData.user) {
        throw new Error('Invalid email or password');
      }

      // Store user data in localStorage for compatibility
      localStorage.setItem("user_data", JSON.stringify({
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.email
      }));

      // Try to get MT5 configuration (optional - doesn't fail login)
      try {
        const apiClient = (await import('@/lib/api-client')).apiClient;
        await apiClient.getMt5Config();
        console.log('MT5 configuration available');
      } catch (mt5Error) {
        console.warn('MT5 configuration unavailable:', mt5Error);
        // Don't fail login if MT5 is not available
      }

      toast({
        title: "🎉 Login Successful!",
        description: `Welcome back, ${authData.user.user_metadata?.name || authData.user.email}!`
      });

      setLoading(false);
      onLogin();
      navigate("/dashboard");

    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>
        </div>
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Trading Boost
          </h1>
          <p className="text-gray-600">Sign in to your trading account</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              🤖 AI Powered
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              🚀 24/7 Active
            </Badge>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Sign In
            </CardTitle>
            <p className="text-sm text-center text-gray-600">
              Access your AI trading dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="demo@tradingai.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="demo123"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Demo Notice */}
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <strong>Demo:</strong> Create an account first to login, or use test@example.com / test123456
              </div>

              {/* Sign In Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Don't have an account?
                </p>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => navigate("/register")}
                  disabled={loading}
                >
                  Create Free Account
                </Button>
                <div className="flex justify-center gap-1">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    7-day free trial
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                    No credit card required
                  </Badge>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">🤖</span>
            </div>
            <p className="text-xs text-gray-600">AI Signals</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">⚡</span>
            </div>
            <p className="text-xs text-gray-600">Auto Trading</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">📊</span>
            </div>
            <p className="text-xs text-gray-600">Analytics</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>© 2024 AI Trading Boost. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/privacy" className="hover:text-gray-700 underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-700 underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}