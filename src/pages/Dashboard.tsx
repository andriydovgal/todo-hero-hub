
import React from 'react';
import Layout from '@/components/Layout';
import TaskList from '@/components/TaskList';
import { AnimatedContainer } from '@/components/ui-components';

const Dashboard = () => {
  return (
    <Layout>
      <AnimatedContainer className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks and keep track of your progress.
          </p>
        </div>
        
        <TaskList />
      </AnimatedContainer>
    </Layout>
  );
};

export default Dashboard;
