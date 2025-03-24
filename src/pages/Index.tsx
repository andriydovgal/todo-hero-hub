
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedContainer } from '@/components/ui-components';

const Index = () => {
  const navigate = useNavigate();
  
  const goToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <AnimatedContainer className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Welcome to TaskHero</h1>
        <p className="text-xl text-muted-foreground mb-8">
          A minimalist task management app inspired by elegant design principles
        </p>
        <Button size="lg" onClick={goToLogin}>
          Get Started
        </Button>
      </AnimatedContainer>
    </div>
  );
};

export default Index;
