import React from 'react';
import { Task } from '@/hooks/useTasks';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Hash,
  Filter
} from 'lucide-react';
import { format, isToday, isAfter, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';

interface TaskSidebarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function TaskSidebar({ tasks, onSelectTask }: TaskSidebarProps) {
  const todayTasks = tasks.filter(t => isSameDay(parseISO(t.date), new Date()) && !t.completed);
  const upcomingTasks = tasks
    .filter(t => isAfter(parseISO(t.date), new Date()) && !t.completed)
    .slice(0, 4);
  
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  
  const categories = Array.from(new Set(tasks.map(t => t.category)));

  return (
    <div className="w-full space-y-4">
      {/* Progress Widget */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-xl overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Progresso
            </h3>
            <span className="text-sm font-black text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 mb-3" />
          <p className="text-[10px] text-muted-foreground font-medium">
            Concluído {completedCount} de {tasks.length}.
          </p>
        </div>
      </div>

      {/* Today Widget */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" />
            Para Hoje
          </h3>
          <Badge variant="secondary" className="h-4 px-1 bg-primary/10 text-primary border-none text-[9px]">
            {todayTasks.length}
          </Badge>
        </div>
        
        <div className="space-y-1.5">
          {todayTasks.length === 0 ? (
            <div className="p-2 rounded-xl bg-muted/20 border border-dashed border-white/10 text-center py-2">
              <p className="text-[9px] text-muted-foreground">Tudo em dia! 🎉</p>
            </div>
          ) : (
            todayTasks.map(task => (
              <motion.div
                key={task.id}
                whileHover={{ x: 2 }}
                onClick={() => onSelectTask(task)}
                className="p-2 rounded-xl bg-background/50 border border-white/5 hover:border-primary/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: task.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate leading-none">{task.title}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="p-1 rounded-xl bg-background/30 border border-white/5 shadow-inner">
        <Calendar
          mode="single"
          selected={new Date()}
          className="w-full"
          classNames={{
            head_cell: "text-muted-foreground w-7 font-normal text-[0.7rem]",
            cell: "h-7 w-7 text-center text-[10px] p-0 relative",
            day: "h-7 w-7 p-0 font-normal",
            caption_label: "text-[10px] font-bold",
            nav_button: "h-5 w-5",
          }}
          locale={ptBR}
        />
      </div>

      {/* Upcoming Widget */}
      <div className="space-y-2">
        <h3 className="font-bold text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-2">
          <CalendarIcon className="w-3 h-3" />
          Próximas
        </h3>
        
        <div className="space-y-2">
          {upcomingTasks.map(task => (
            <div 
              key={task.id} 
              className="group relative flex items-start gap-2 cursor-pointer"
              onClick={() => onSelectTask(task)}
            >
              <div className="mt-0.5 space-y-0 min-w-[24px]">
                <p className="text-[8px] font-black uppercase text-muted-foreground leading-none">{format(new Date(task.date), 'EEE', { locale: ptBR })}</p>
                <p className="text-[11px] font-black leading-none">{format(new Date(task.date), 'dd')}</p>
              </div>
              <div className="flex-1 p-2 rounded-xl bg-muted/20 border border-white/5 group-hover:bg-muted/30 transition-all">
                <p className="text-[10px] font-bold truncate leading-none">{task.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Widget - Hidden Toggle/Mobile */}
      <div className="hidden sm:block space-y-4 pt-4 border-t border-white/5">
        <h3 className="font-bold text-sm tracking-widest uppercase text-muted-foreground flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Categorias
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Badge key={cat} variant="secondary" className="bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer py-1 px-3">
              {cat}
              <span className="ml-2 opacity-50 font-black">
                {tasks.filter(t => t.category === cat).length}
              </span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
