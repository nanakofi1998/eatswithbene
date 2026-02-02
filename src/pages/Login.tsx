import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChefHat, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error("Invalid email or password");
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error("Please confirm your email address first");
        } else {
          throw error;
        }
      }

      // Check if user has vendor role (you'll need to implement this)  
      // For now, assume all logged in users are vendors
      
      // Save remember me preference
      if (formData.rememberMe) {
        localStorage.setItem("vendor_email", formData.email);
      } else {
        localStorage.removeItem("vendor_email");
      }

      toast({
        title: "Welcome back! 🎉",
        description: "Successfully logged in to your vendor dashboard.",
      });

      // Navigate to vendor dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Load remembered email on component mount
  useState(() => {
    const rememberedEmail = localStorage.getItem("vendor_email");
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col"
    >
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-3">
              Vendor <span className="text-primary">Portal</span>
            </h1>
            <p className="text-muted-foreground">
              Sign in to manage your restaurant
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="rounded-2xl border-border/50 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              
              <CardHeader className="relative text-center pb-4">
                <CardTitle className="text-xl font-display font-semibold">
                  Sign In to Dashboard
                </CardTitle>
                <CardDescription>
                  Enter your credentials to access your vendor panel
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="vendor@restaurant.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`h-12 rounded-xl pl-12 ${
                          errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                        }`}
                      />
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-destructive"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`h-12 rounded-xl pl-12 pr-12 ${
                          errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                        }`}
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-destructive"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => 
                          handleInputChange("rememberMe", checked as boolean)
                        }
                      />
                      <Label htmlFor="remember" className="text-sm cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        toast({
                          title: "Password Reset",
                          description: "Contact admin to reset your password",
                        });
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  {/* Submit Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        "Sign In to Dashboard"
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Divider */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Vendor Access Only
                    </span>
                  </div>
                </div>

                {/* Contact Admin */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have vendor access?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary p-0 h-auto font-semibold"
                      onClick={() => {
                        toast({
                          title: "Contact Admin",
                          description: "Email: admin@eatswithbene.com",
                        });
                      }}
                    >
                      Contact Administrator
                    </Button>
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="relative border-t border-border/50 pt-4">
                <p className="text-xs text-center text-muted-foreground w-full">
                  By signing in, you agree to our{" "}
                  <Button variant="link" className="p-0 h-auto text-primary text-xs">
                    Vendor Terms
                  </Button>{" "}
                  and{" "}
                  <Button variant="link" className="p-0 h-auto text-primary text-xs">
                    Privacy Policy
                  </Button>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Eats With Bene</span>
              <span className="text-muted-foreground text-sm">• Vendor Portal</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default Login;