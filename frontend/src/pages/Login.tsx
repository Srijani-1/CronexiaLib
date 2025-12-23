import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Sparkles, Github, Mail, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
}

export function Login({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    api?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string; api?: string } =
      {};

    if (!formData.identifier) {
      newErrors.identifier = "Email or phone number is required";
    } else if (
      formData.identifier.includes("@") &&
      !/\S+@\S+\.\S+/.test(formData.identifier)
    ) {
      newErrors.identifier = "Please enter a valid email address";
    } else if (
      !formData.identifier.includes("@") &&
      formData.identifier.replace(/\D/g, "").length < 10
    ) {
      newErrors.identifier = "Please enter a valid phone number";
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

    setErrors({});
    if (!validateForm()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        setErrors({ api: "Invalid credentials. Please check your details." });
        return;
      }

      const data = await res.json();

      // ✅ Save token
      sessionStorage.setItem("token", data.access_token);

      // ✅ Save user
      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      login(data.user);
      // Call parent handler if needed
      onLogin(formData.identifier, formData.password);

      // Redirect
      navigate("/dashboard");


    } catch (error) {
      console.error(error);
      setErrors({ api: "Server error. Try again later." });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Log in to access your CronexiaLib account
          </p>
        </div>

        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle>Log In</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Phone Number</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@example.com / 9876543210"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                />
                {errors.identifier && (
                  <p className="text-red-500 text-sm">{errors.identifier}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="#"
                    className="text-sm text-violet-600 hover:text-violet-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="flex-1"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="
        h-10 w-10
        flex items-center justify-center
        rounded-md
        border border-input
        bg-background
        text-muted-foreground
        hover:text-violet-600
        hover:border-violet-300
        transition-colors
      "
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>


              {errors.api && (
                <p className="text-red-500 text-sm text-center">
                  {errors.api}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                Log In
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button variant="outline" className="w-full">
                  <Github className="h-5 w-5 mr-2" /> Github
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="h-5 w-5 mr-2" /> Google
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="text-sm text-center w-full text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-violet-600 hover:text-violet-700 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
