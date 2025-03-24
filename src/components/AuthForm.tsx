
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassSection } from './ui-components';
import { signIn, signUp } from '@/lib/supabase';
import { toast } from 'sonner';
import { AnimatedContainer } from './ui-components';

type FormMode = 'login' | 'register';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormValues = z.infer<typeof formSchema>;

export const AuthForm = () => {
  const [mode, setMode] = useState<FormMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        
        toast.success('Logged in successfully');
        navigate('/dashboard');
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) throw error;
        
        toast.success('Account created successfully. Please sign in.');
        setMode('login');
        reset();
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    reset();
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
                : 'Enter your information to create an account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-white/50"
                  {...register('email')}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-sm text-muted-foreground text-center">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <Button
                variant="link"
                className="pl-1.5 pr-0 h-auto"
                onClick={toggleMode}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </GlassSection>
    </AnimatedContainer>
  );
};

export default AuthForm;
