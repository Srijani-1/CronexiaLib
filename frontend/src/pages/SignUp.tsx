import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { Sparkles, Github, Mail, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from "react-router-dom";

interface SignUpProps {
    onSwitchToLogin: () => void;
}
export function SignUp({ onSwitchToLogin }: SignUpProps) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        agreeToTerms: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (formData.phone.replace(/\D/g, '').length < 10) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        // Terms agreement validation
        if (!formData.agreeToTerms) {
            newErrors.terms = 'You must agree to the terms & conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const navigate = useNavigate();
    const registerUser = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                const message =
                    typeof result.detail === "string"
                        ? result.detail
                        : Array.isArray(result.detail)
                            ? result.detail.map((e: any) => e.msg).join(', ')
                            : "Registration failed";

                setErrors({ api: message });
                return;
            }
            navigate("/login");
        } catch (error) {
            setErrors({ api: "Server error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            await registerUser();
        }
    };
    const updateField = (field: string, value: string | boolean) => {
        setFormData({ ...formData, [field]: value });
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };


    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl mb-4">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="mb-2">Create Account</h1>
                    <p className="text-muted-foreground">Join CronexiaLib and start building with AI</p>
                </div>

                {/* Card */}
                <Card className="shadow-xl border-2">
                    <CardHeader>
                        <CardTitle>Sign Up</CardTitle>
                        <CardDescription>Create your account to get started</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* FULL NAME */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => updateField("fullName", e.target.value)}
                                    placeholder="John Doe"
                                />
                                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
                            </div>

                            {/* EMAIL */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    placeholder="you@example.com"
                                />
                                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                            </div>

                            {/* PHONE */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                    placeholder="9876543210"
                                />
                                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                            </div>

                            {/* PASSWORD */}
                            {/* PASSWORD */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>

                                <div className="flex items-center gap-2">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => updateField("password", e.target.value)}
                                        placeholder="Create a password"
                                        className="flex-1"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-violet-600 hover:border-violet-300 transition-colors"
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
                                    <p className="text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>


                            {/* CONFIRM PASSWORD */}
                            {/* CONFIRM PASSWORD */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>

                                <div className="flex items-center gap-2">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            updateField("confirmPassword", e.target.value)
                                        }
                                        placeholder="Confirm your password"
                                        className="flex-1"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword((prev) => !prev)
                                        }
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
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide confirm password"
                                                : "Show confirm password"
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-600">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>


                            {/* TERMS */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={formData.agreeToTerms}
                                    onCheckedChange={(checked: boolean) =>
                                        updateField("agreeToTerms", checked)
                                    }
                                />
                                <Label htmlFor="terms" className="text-sm cursor-pointer">
                                    I agree to the{" "}
                                    <Link to="#" className="text-violet-600">Terms of Service</Link> and{" "}
                                    <Link to="#" className="text-violet-600">Privacy Policy</Link>
                                </Label>
                            </div>
                            {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}

                            {/* API ERROR */}
                            {errors.api && (
                                <div className="p-3 bg-red-100 border border-red-300 text-red-600 rounded">
                                    {errors.api}
                                </div>
                            )}

                            {/* SUBMIT BUTTON */}
                            <Button
                                type="submit"
                                size="lg"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                            >
                                {loading ? "Creating Account..." : "Create Account"}
                            </Button>
                        </form>

                        {/* OR SEPARATOR */}
                        <div className="mt-6">
                            <div className="relative">
                                <Separator />
                                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                                    Or sign up with
                                </span>
                            </div>

                            {/* SOCIAL BUTTONS */}
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <Button variant="outline"><Github className="h-5 w-5 mr-2" />Github</Button>
                                <Button variant="outline"><Mail className="h-5 w-5 mr-2" />Google</Button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter>
                        <p className="text-sm text-center w-full text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-violet-600 font-medium">Log in</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}