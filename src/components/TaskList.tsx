
import React, { useState, useEffect } from 'react';
import { PlusIcon, Loader2, SearchIcon, CheckCircle2, CircleIcon, MoreHorizontal, X } from 'lucide-react';
import { Task, TaskStatus, getTasks, updateTask, deleteTask, getUserProfile, isAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { StatusBadge, PriorityIndicator, EmptyState, TaskListSkeleton } from './ui-components';
import { AnimatedContainer } from './ui-components';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import { supabase } from '@/integrations/supabase/client';

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
        
        // If admin, fetch all user emails for displaying task owners
        if (adminStatus) {
          const { data: profiles, error } = await supabase
            .from('user_profiles')
            .select('id, email');
            
          if (error) {
            console.error('Error fetching user profiles:', error);
            return;
          }
          
          const emailMap: Record<string, string> = {};
          profiles?.forEach(profile => {
            emailMap[profile.id] = profile.email;
          });
          
          setUserEmails(emailMap);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getTasks();
      if (error) throw error;
      
      // Ensure data is properly typed as Task[]
      const typedData = data ? data.map(item => ({
        ...item,
        status: item.status as TaskStatus
      })) : [];
      
      setTasks(typedData);
      setFilteredTasks(typedData);
    } catch (error: any) {
      toast.error('Failed to fetch tasks: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(tasks);
    }
  }, [searchQuery, tasks]);
  
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const { data, error } = await updateTask(taskId, { status: newStatus });
      if (error) throw error;
      
      // Update the task in the local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
    } catch (error: any) {
      toast.error('Failed to update task: ' + error.message);
    }
  };
  
  const handleTaskDelete = async (taskId: string) => {
    try {
      const { error } = await deleteTask(taskId);
      if (error) throw error;
      
      // Remove the task from the local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete task: ' + error.message);
    }
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };
  
  const handleTaskCreated = (newTask: Task) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setShowTaskForm(false);
  };
  
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
    setEditingTask(null);
    setShowTaskForm(false);
  };
  
  const TaskFormModal = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <Card className="shadow-lg border-0">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <TaskForm 
            task={editingTask}
            onTaskCreated={handleTaskCreated}
            onTaskUpdated={handleTaskUpdated}
            onCancel={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}
          />
        </Card>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={() => {
          setEditingTask(null);
          setShowTaskForm(true);
        }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
      
      <AnimatedContainer className="space-y-3">
        {isLoading ? (
          <TaskListSkeleton />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No tasks found" : "No tasks yet"}
            description={
              searchQuery 
                ? "Try a different search term or clear the search"
                : "Create your first task to get started"
            }
            action={
              <Button onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            }
          />
        ) : (
          filteredTasks.map((task, index) => (
            <AnimatedContainer 
              key={task.id} 
              delay={index * 50}
              className="task-item-hover"
            >
              <TaskItem 
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleTaskDelete}
                onEdit={handleEditTask}
                userEmail={userEmails[task.user_id]}
                isAdmin={isUserAdmin}
              />
            </AnimatedContainer>
          ))
        )}
      </AnimatedContainer>
      
      {showTaskForm && <TaskFormModal />}
    </div>
  );
};

export default TaskList;
