
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassSection } from './ui-components';
import { signIn, signUp, verifyInvitationToken, Invitation } from '@/lib/supabase';
import { toast } from 'sonner';
import { AnimatedContainer } from './ui-components';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

type FormMode = 'login' | 'register' | 'set-password';
type InvitationResult = Invitation | { error: string };

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export const AuthForm = () => {
  const [mode, setMode] = useState<FormMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  useEffect(() => {
    // Check for invitation token in URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (token) {
      console.log('Found token in URL:', token);
      // Verify the token and get the associated email
      const verifyToken = async () => {
        setIsVerifyingToken(true);
        setInvitationError(null);
        try {
          console.log('Verifying token:', token);
          const result = await verifyInvitationToken(token) as InvitationResult;
          
          if ('error' in result) {
            console.log('Invitation verification error:', result.error);
            switch (result.error) {
              case 'already_used':
                setInvitationError('This invitation has already been used');
                toast.error('This invitation has already been used');
                break;
              case 'expired':
                setInvitationError('This invitation has expired');
                toast.error('This invitation has expired');
                break;
              case 'not_found':
                setInvitationError('Invalid invitation token');
                toast.error('Invalid invitation token');
                break;
              default:
                setInvitationError('Invalid or expired invitation');
                toast.error('Invalid or expired invitation');
            }
            setInvitationToken(null);
          } else {
            console.log('Token verified successfully:', result);
            setInvitationToken(token);
            setInvitationEmail(result.email);
            setMode('set-password');
            loginForm.setValue('email', result.email);
            toast.info('Please set your password to complete registration');
          }
        } catch (error) {
          console.error('Error verifying invitation token:', error);
          setInvitationError('Error verifying invitation');
          toast.error('Error verifying invitation');
        } finally {
          setIsVerifyingToken(false);
        }
      };
      
      verifyToken();
    }
  }, [location.search, loginForm]);
  
  const handleLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        
        toast.success('Logged in successfully');
        navigate('/dashboard');
      } else if (mode === 'register') {
        // Check if we have an invitation token
        if (invitationToken) {
          const { error } = await signUp(data.email, data.password, invitationToken);
          if (error) throw error;
          
          toast.success('Account created successfully. Please sign in.');
          setMode('login');
          loginForm.reset();
        } else {
          toast.error('Registration is only available via invitation');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      if (!invitationEmail || !invitationToken) {
        throw new Error('Invitation information is missing');
      }

      const { error } = await signUp(invitationEmail, data.password, invitationToken);
      if (error) throw error;
      
      toast.success('Account created successfully. Please sign in.');
      setMode('login');
      loginForm.setValue('email', invitationEmail);
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AnimatedContainer className="w-full max-w-md mx-auto">
      <GlassSection className="w-full">
        <Card className="border-none bg-transparent shadow-none">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-medium">
              {mode === 'login' ? 'Welcome back' : 
               mode === 'register' ? 'Create an account' : 
               'Set your password'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === 'login'
                ? 'Enter your credentials to sign in'
                : mode === 'register'
                ? 'Complete your registration'
                : 'Create a secure password for your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifyingToken && (
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Verifying invitation, please wait...
                </AlertDescription>
              </Alert>
            )}
          
            {invitationError && (
              <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
                <InfoIcon className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  {invitationError}
                </AlertDescription>
              </Alert>
            )}
          
            {mode === 'register' && !invitationToken && (
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Registration is by invitation only. Please contact an administrator.
                </AlertDescription>
              </Alert>
            )}
            
            {mode === 'set-password' ? (
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                {invitationEmail && (
                  <div className="space-y-2">
                    <Label htmlFor="email-display">Email</Label>
                    <Input
                      id="email-display"
                      type="email"
                      value={invitationEmail}
                      className="bg-white/50"
                      disabled
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-white/50"
                    {...passwordForm.register('password')}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-white/50"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Create Account'}
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="bg-white/50"
                    {...loginForm.register('email')}
                    disabled={mode === 'register' && !!invitationEmail}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-white/50"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || (mode === 'register' && !invitationToken)}
                >
                  {isLoading 
                    ? 'Loading...' 
                    : mode === 'login' 
                      ? 'Sign In' 
                      : 'Sign Up'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            {mode === 'login' && (
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account? Please ask for an invitation.
              </p>
            )}
            {(mode === 'register' || mode === 'set-password') && invitationToken && (
              <Button
                variant="link"
                className="pl-1.5 pr-0 h-auto"
                onClick={() => {
                  setMode('login');
                  setInvitationToken(null);
                  setInvitationEmail(null);
                  loginForm.reset();
                  passwordForm.reset();
                }}
              >
                Back to login
              </Button>
            )}
          </CardFooter>
        </Card>
      </GlassSection>
    </AnimatedContainer>
  );
};

export default AuthForm;
