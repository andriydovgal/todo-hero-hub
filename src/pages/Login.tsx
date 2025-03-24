
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '@/components/AuthForm';
import { getCurrentUser } from '@/lib/supabase';
import { AnimatedContainer } from '@/components/ui-components';

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await getCurrentUser();
        if (user) {
          // User is already signed in, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    
    checkUser();
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <AnimatedContainer className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">TaskHero</h1>
          <p className="text-muted-foreground mt-2">
            The minimalist task management app
          </p>
        </div>
        
        <AuthForm />
      </AnimatedContainer>
    </div>
  );
};

export default Login;
