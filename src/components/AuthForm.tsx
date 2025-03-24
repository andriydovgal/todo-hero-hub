
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
import { signIn, signUp, verifyInvitationToken } from '@/lib/supabase';
import { toast } from 'sonner';
import { AnimatedContainer } from './ui-components';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

type FormMode = 'login' | 'register';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormValues = z.infer<typeof formSchema>;

export const AuthForm = () => {
  const [mode, setMode] = useState<FormMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  useEffect(() => {
    // Check for invitation token in URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (token) {
      setMode('register');
      setInvitationToken(token);
      
      // Verify the token and get the associated email
      const verifyToken = async () => {
        const invitation = await verifyInvitationToken(token);
        
        if (invitation) {
          setInvitationEmail(invitation.email);
          setValue('email', invitation.email);
          toast.info('Please complete your registration');
        } else {
          toast.error('Invalid or expired invitation');
          setInvitationToken(null);
        }
      };
      
      verifyToken();
    }
  }, [location.search, setValue]);
  
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        
        toast.success('Logged in successfully');
        navigate('/dashboard');
      } else {
        // Check if we have an invitation token
        if (invitationToken) {
          const { error } = await signUp(data.email, data.password, invitationToken);
          if (error) throw error;
          
          toast.success('Account created successfully. Please sign in.');
          setMode('login');
          reset();
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
  
  return (
    <AnimatedContainer className="w-full max-w-md mx-auto">
      <GlassSection className="w-full">
        <Card className="border-none bg-transparent shadow-none">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-medium">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === 'login'
                ? 'Enter your credentials to sign in'
                : 'Complete your registration'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'register' && !invitationToken && (
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Registration is by invitation only. Please contact an administrator.
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-white/50"
                  {...register('email')}
                  disabled={mode === 'register' && !!invitationEmail}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-white/50"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
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
          </CardContent>
          <CardFooter className="flex flex-col">
            {mode === 'login' && (
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account? Please ask for an invitation.
              </p>
            )}
            {mode === 'register' && invitationToken && (
              <Button
                variant="link"
                className="pl-1.5 pr-0 h-auto"
                onClick={() => {
                  setMode('login');
                  setInvitationToken(null);
                  setInvitationEmail(null);
                  reset();
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
