
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Task, getUserRole } from '@/lib/supabase';
import { StatusBadge, PriorityIndicator } from './ui-components';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle2, 
  CircleIcon, 
  MoreHorizontal, 
  Calendar, 
  Pencil, 
  Trash2,
  Clock,
  UserIcon
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  userEmail?: string;
  isAdmin?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onStatusChange,
  onDelete,
  onEdit,
  userEmail,
  isAdmin = false
}) => {
  const { id, title, description, status, due_date, priority, category, user_id } = task;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
      default:
        return <CircleIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const formatDueDate = (date: string | null | undefined) => {
    if (!date) return null;
    return format(new Date(date), 'PPP');
  };
  
  return (
    <Card className="bg-white/70 border border-gray-100 shadow-sm hover:shadow transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              const newStatus = status === 'completed' 
                ? 'pending' 
                : 'completed';
              onStatusChange(id, newStatus);
            }}
            className="mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
          >
            {getStatusIcon()}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className={`font-medium text-balance ${status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1 mb-2 text-balance">
                    {description}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onStatusChange(id, 'pending')}
                    disabled={status === 'pending'}
                  >
                    <CircleIcon className="mr-2 h-4 w-4" />
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStatusChange(id, 'in_progress')}
                    disabled={status === 'in_progress'}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStatusChange(id, 'completed')}
                    disabled={status === 'completed'}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(id)} 
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <StatusBadge status={status} />
              <PriorityIndicator priority={priority} />
              
              {category && (
                <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  {category}
                </div>
              )}
              
              {due_date && (
                <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  <Calendar className="h-3 w-3" />
                  {formatDueDate(due_date)}
                </div>
              )}
              
              {isAdmin && userEmail && (
                <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <UserIcon className="h-3 w-3" />
                  {userEmail}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskItem;
