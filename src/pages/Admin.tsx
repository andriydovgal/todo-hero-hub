
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { AnimatedContainer } from '@/components/ui-components';
import InvitationForm from '@/components/InvitationForm';
import InvitationList from '@/components/InvitationList';
import { getUserRole } from '@/lib/supabase';
import { toast } from 'sonner';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      try {
        const role = await getUserRole();
        
        if (role !== 'admin') {
          toast.error('You do not have permission to access this page');
          navigate('/dashboard');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  if (isLoading) {
    return (
      <Layout>
        <AnimatedContainer className="space-y-6">
          <p>Loading...</p>
        </AnimatedContainer>
      </Layout>
    );
  }
  
  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <Layout>
      <AnimatedContainer className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and invitations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <InvitationForm />
          </div>
          <div className="md:col-span-2">
            <InvitationList />
          </div>
        </div>
      </AnimatedContainer>
    </Layout>
  );
};

export default Admin;
