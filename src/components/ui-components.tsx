
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckIcon, CircleIcon, Circle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { TaskStatus } from '@/lib/supabase';

// Section with glass morphism effect
export const GlassSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass-morph rounded-xl p-6 transition-all duration-300 ease-spring",
      className
    )}
    {...props}
  />
));
GlassSection.displayName = "GlassSection";

// Container with animation entry
export const AnimatedContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { delay?: number }
>(({ className, delay = 0, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("appear-animate", className)}
    style={{
      ...style,
      animationDelay: `${delay}ms`,
    }}
    {...props}
  />
));
AnimatedContainer.displayName = "AnimatedContainer";

// Status badge for tasks
export const StatusBadge = ({ status }: { status: TaskStatus }) => {
  let bgColor = '';
  let icon = null;
  
  switch (status) {
    case 'pending':
      bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      icon = <Circle className="h-3.5 w-3.5 text-yellow-500" />;
      break;
    case 'in_progress':
      bgColor = 'bg-blue-100 text-blue-800 border-blue-200';
      icon = <Clock className="h-3.5 w-3.5 text-blue-500" />;
      break;
    case 'completed':
      bgColor = 'bg-green-100 text-green-800 border-green-200';
      icon = <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      break;
    default:
      bgColor = 'bg-gray-100 text-gray-800 border-gray-200';
      icon = <AlertCircle className="h-3.5 w-3.5 text-gray-500" />;
  }
  
  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${bgColor}`}>
      {icon}
      <span className="capitalize">{status.replace('_', ' ')}</span>
    </div>
  );
};

// Priority indicator
export const PriorityIndicator = ({ priority }: { priority: number }) => {
  const color = priority === 3 
    ? 'bg-red-400' 
    : priority === 2 
      ? 'bg-yellow-400' 
      : 'bg-blue-400';
  
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">
        {priority === 3 ? 'High' : priority === 2 ? 'Medium' : 'Low'}
      </span>
    </div>
  );
};

// Empty state component
export const EmptyState = ({ 
  title, 
  description,
  action,
  icon: Icon,
}: { 
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <Card className="flex flex-col items-center justify-center p-8 text-center h-[300px]">
    {Icon && <Icon className="h-16 w-16 text-muted-foreground/40 mb-4" />}
    <h3 className="text-lg font-medium">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-[260px]">{description}</p>
    {action}
  </Card>
);

// Loading skeleton for tasks
export const TaskSkeleton = () => (
  <div className="space-y-2">
    <div className="flex items-start gap-3">
      <Skeleton className="h-5 w-5 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
    <Separator className="my-3" />
  </div>
);

// Loading skeletons for the task list
export const TaskListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3 animate-pulse">
    {Array(count).fill(0).map((_, i) => (
      <TaskSkeleton key={i} />
    ))}
  </div>
);
