
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, createTask, updateTask } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  due_date: z.date().optional().nullable(),
  priority: z.number().min(1).max(3),
  category: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task | null;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onCancel?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onTaskCreated,
  onTaskUpdated,
  onCancel,
}) => {
  const isEditing = !!task;
  
  const defaultValues: TaskFormValues = {
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    due_date: task?.due_date ? new Date(task.due_date) : null,
    priority: task?.priority || 1,
    category: task?.category || '',
  };
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });
  
  const selectedDate = watch('due_date');
  
  const onSubmit = async (data: TaskFormValues) => {
    try {
      if (isEditing && task) {
        const { data: updatedTask, error } = await updateTask(task.id, {
          title: data.title,
          description: data.description,
          status: data.status,
          due_date: data.due_date ? data.due_date.toISOString() : null,
          priority: data.priority,
          category: data.category || null,
        });
        
        if (error) throw error;
        if (updatedTask && onTaskUpdated) {
          onTaskUpdated(updatedTask);
          toast.success('Task updated successfully');
        }
      } else {
        const { data: newTask, error } = await createTask({
          title: data.title,
          description: data.description,
          status: data.status,
          due_date: data.due_date ? data.due_date.toISOString() : null,
          priority: data.priority,
          category: data.category || null,
        });
        
        if (error) throw error;
        if (newTask && onTaskCreated) {
          onTaskCreated(newTask);
          toast.success('Task created successfully');
        }
        
        reset();
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            {...register('title')} 
            placeholder="Task title" 
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea 
            id="description" 
            {...register('description')} 
            placeholder="Task description" 
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              defaultValue={defaultValues.status} 
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              defaultValue={defaultValues.priority.toString()} 
              onValueChange={(value) => setValue('priority', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => setValue('due_date', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input 
              id="category" 
              {...register('category')} 
              placeholder="e.g., Work, Personal" 
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? 'Saving...' 
              : isEditing 
                ? 'Update Task' 
                : 'Create Task'
            }
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
