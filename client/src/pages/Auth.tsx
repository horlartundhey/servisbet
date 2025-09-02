import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PasswordStrength from "@/components/ui/password-strength";
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/authService';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user, isAuthenticated, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  // Redirect function based on user role
  const redirectToDashboard = (userRole: string) => {
    console.log('Redirecting user with role:', userRole); // Debug log
    const from = location.state?.from?.pathname || '/';
    
    switch (userRole) {
      case 'admin':
        console.log('Redirecting to /admin');
        navigate('/admin', { replace: true });
        break;
      case 'business':
        console.log('Redirecting to /business-dashboard');
        navigate('/business-dashboard', { replace: true });
        break;
      case 'user':
        console.log('Redirecting to /profile');
        navigate(from === '/auth' ? '/profile' : from, { replace: true });
        break;
      default:
        console.log('Falling back to home page, userRole was:', userRole);
        navigate('/', { replace: true });
    }
  };

  // Check if user is already authenticated on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectToDashboard(user.role);
    }
    
    // Check if we should show resend verification
    if (location.state?.showResendVerification) {
      setShowResendVerification(true);
    }
  }, [isAuthenticated, user, navigate]);

  // Debounced email availability check
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (registerData.email && registerData.email.includes('@')) {
        setEmailCheckLoading(true);
        try {
          const response = await authService.checkEmailAvailability(registerData.email);
          setEmailAvailable(response.available);
        } catch (error) {
          console.error('Error checking email availability:', error);
          setEmailAvailable(null);
        } finally {
          setEmailCheckLoading(false);
        }
      } else {
        setEmailAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [registerData.email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await login(loginData.email, loginData.password);
      console.log('Login response:', response); // Debug log
      setSuccess('Login successful! Redirecting...');
      
      // Get user role from response and redirect accordingly
      setTimeout(() => {
        const roleToUse = response?.user?.role || user?.role || 'user';
        console.log('Using role for redirect:', roleToUse); // Debug log
        redirectToDashboard(roleToUse);
      }, 1000);
    } catch (err: any) {
      const errorData = err.response?.data;
      
      // Handle email verification requirement
      if (errorData?.code === 'EMAIL_NOT_VERIFIED') {
        setError(errorData.message);
        setShowResendVerification(true);
        setVerificationEmail(errorData.data?.email || loginData.email);
      } else {
        setError(errorData?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await register({
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role as 'user' | 'business'
      });

      setSuccess('Registration successful! Please check your email to verify your account before logging in.');
      setVerificationEmail(registerData.email);
      setShowResendVerification(true);
      setIsSignUp(false); // Switch to login form
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    console.log(`Authenticating with ${provider}`);
    // TODO: Implement social auth providers later
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await authService.resendVerificationEmailPublic(verificationEmail || loginData.email);
      setSuccess('Verification email sent! Please check your inbox.');
      setShowResendVerification(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">ServisbetA</h1>
          <p className="text-muted-foreground">Join our trusted business review community</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {showResendVerification && (
              <Alert className="mb-4">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Please verify your email address. Check your inbox for a verification email.
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-semibold ml-2"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                  >
                    Resend verification email
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => {
              setIsSignUp(value === "signup");
              setError('');
              setSuccess('');
              setShowResendVerification(false);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                      {emailCheckLoading && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                      )}
                    </div>
                    {emailAvailable === false && (
                      <p className="text-sm text-red-600">Email is already taken</p>
                    )}
                    {emailAvailable === true && (
                      <p className="text-sm text-green-600">Email is available</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Select value={registerData.role} onValueChange={(value) => setRegisterData({ ...registerData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Customer</SelectItem>
                        <SelectItem value="business">Business Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                    <PasswordStrength password={registerData.password} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                    />
                    {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
                      <p className="text-sm text-red-600">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm">
                      I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !acceptedTerms || emailAvailable === false}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;