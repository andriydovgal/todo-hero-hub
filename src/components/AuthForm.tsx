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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AnimatedContainer } from './ui-components';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { AuthError } from '@supabase/supabase-js';
import { env } from '@/config/env';

type FormMode = 'login' | 'register' | 'set-password' | 'forgot-password';
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

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' })
});

type LoginFormValues = z.infer<typeof loginSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

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

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (token) {
      console.log('Found token in URL:', token);
      const verifyToken = async () => {
        setIsVerifyingToken(true);
        setInvitationError(null);
        try {
          // Trim the token to remove any whitespace that might have been added
          const cleanToken = token.trim();
          console.log('Verifying cleaned token:', cleanToken);

          const result = await verifyInvitationToken(cleanToken) as InvitationResult;

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
              case 'database_error':
                setInvitationError('Error accessing invitation database');
                toast.error('Error accessing invitation database');
                break;
              default:
                setInvitationError('Invalid or expired invitation');
                toast.error('Invalid or expired invitation');
            }
            setInvitationToken(null);
          } else {
            console.log('Token verified successfully:', result);
            setInvitationToken(cleanToken);
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
        const { error, data: authData } = await signIn(data.email, data.password);
        if (error) throw error;

        if (authData?.user?.user_metadata?.requires_password_setup) {
          setMode('set-password');
          toast.info('You need to set a secure password before continuing');
          return;
        }

        toast.success('Logged in successfully');
        navigate('/dashboard');
      } else if (mode === 'register') {
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
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      if (!invitationEmail && !loginForm.getValues('email')) {
        throw new Error('Email information is missing');
      }

      const email = invitationEmail || loginForm.getValues('email');

      if (invitationToken) {
        const { error } = await signUp(email, data.password, invitationToken);
        if (error) throw error;

        toast.success('Account created successfully. Please sign in.');
        setMode('login');
        loginForm.setValue('email', email);
      } else {
        const { error } = await updatePasswordAfterInvitation(data.password);
        if (error) throw error;

        toast.success('Password updated successfully');
        navigate('/dashboard');
      }

      passwordForm.reset();
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormValues) => {
    console.log('handleForgotPassword called with email:', data.email);
    setIsLoading(true);
    try {
      console.log('Calling resetPasswordForEmail with redirectTo:', env.getResetPasswordUrl());
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: env.getResetPasswordUrl()
      });

      if (error) throw error;

      toast.success('If an account exists with this email, you will receive password reset instructions.');
      setMode('login');
      forgotPasswordForm.reset();
    } catch (error) {
      toast.error('Failed to process your request. Please try again later.');
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
                  mode === 'forgot-password' ? 'Reset Password' :
                    'Set your password'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === 'login'
                ? 'Enter your credentials to sign in'
                : mode === 'register'
                  ? 'Complete your registration'
                  : mode === 'forgot-password'
                    ? 'Enter your email to receive reset instructions'
                    : invitationToken
                      ? 'Create a secure password for your account'
                      : 'You need to set a secure password before continuing'}
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

            {mode === 'forgot-password' ? (
              <form onSubmit={forgotPasswordForm.handleSubmit((email) => handleForgotPassword(email))}
                className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="bg-white/50"
                    {...forgotPasswordForm.register('email')}
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{forgotPasswordForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </form>
            ) : mode === 'set-password' ? (
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                {(invitationEmail || loginForm.getValues('email')) && (
                  <div className="space-y-2">
                    <Label htmlFor="email-display">Email</Label>
                    <Input
                      id="email-display"
                      type="email"
                      value={invitationEmail || loginForm.getValues('email')}
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
                  {isLoading ? 'Loading...' : invitationToken ? 'Create Account' : 'Update Password'}
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
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Don't have an account? Please ask for an invitation.
                </p>
                <Button
                  variant="link"
                  className="pl-1.5 pr-0 h-auto"
                  onClick={() => setMode('forgot-password')}
                >
                  Forgot your password?
                </Button>
              </>
            )}
            {(mode !== 'login') && (
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

const updatePasswordAfterInvitation = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        requires_password_setup: false,
      }
    });

    return { error };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error };
  }
};

export default AuthForm;
