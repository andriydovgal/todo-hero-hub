
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { AnimatedContainer } from '@/components/ui-components';
import InvitationForm from '@/components/InvitationForm';
import InvitationList from '@/components/InvitationList';
import TaskList from '@/components/TaskList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
            Manage users, invitations, and all tasks
          </p>
        </div>
        
        <Tabs defaultValue="invitations" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="invitations">User Management</TabsTrigger>
            <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invitations" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <InvitationForm />
              </div>
              <div className="md:col-span-2">
                <InvitationList />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <TaskList />
          </TabsContent>
        </Tabs>
      </AnimatedContainer>
    </Layout>
  );
};

export default Admin;
