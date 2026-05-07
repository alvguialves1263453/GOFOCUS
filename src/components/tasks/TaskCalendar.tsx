import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval, isToday, parseISO, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const TIME_ZONE = 'America/Sao_Paulo';

// Helper to parse YYYY-MM-DD string to local Date object
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MoreHorizontal,
  ChevronDown,
  LayoutGrid,
  Rows,
  CalendarDays,
  ListTodo,
  Calendar as CalendarIconSmall,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/hooks/useTasks';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';

interface TaskCalendarProps {
  tasks: Task[];
  onSelectDate: (date: Date) => void;
  onEditTask: (task: Task) => void;
  view: 'month' | 'week' | 'agenda';
  setView: (view: 'month' | 'week' | 'agenda') => void;
}

export function TaskCalendar({ tasks, onSelectDate, onEditTask, view, setView }: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center bg-muted/30 p-0.5 rounded-lg border border-white/5">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-6 w-6 rounded-md hover:bg-background/50">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" onClick={goToToday} className="h-6 px-2 text-[10px] font-medium rounded-md hover:bg-background/50">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-6 w-6 rounded-md hover:bg-background/50">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center bg-muted/30 p-0.5 rounded-lg border border-white/5">
          <Button 
            variant={view === 'month' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setView('month')}
            className={cn("h-6 px-2 gap-1 rounded-md text-[10px]", view === 'month' && "bg-background text-foreground shadow-sm")}
          >
            <LayoutGrid className="h-3 w-3" /> Mês
          </Button>
          <Button 
            variant={view === 'week' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setView('week')}
            className={cn("h-6 px-2 gap-1 rounded-md text-[10px]", view === 'week' && "bg-background text-foreground shadow-sm")}
          >
            <CalendarDays className="h-3 w-3" /> Semana
          </Button>
          <Button 
            variant={view === 'agenda' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setView('agenda')}
            className={cn("h-6 px-2 gap-1 rounded-md text-[10px]", view === 'agenda' && "bg-background text-foreground shadow-sm")}
          >
            <Rows className="h-3 w-3" /> Agenda
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const dayTasks = tasks.filter(t => {
          const taskDate = parseLocalDate(t.date);
          return isSameDay(taskDate, cloneDay);
        });
        
        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative min-h-[65px] sm:min-h-[85px] border border-white/5 p-1 transition-all group overflow-hidden",
              !isSameMonth(day, monthStart) ? "bg-muted/10 opacity-20" : "hover:bg-primary/5",
              isToday(day) && "bg-primary/5 ring-1 ring-inset ring-primary/20",
            )}
            onClick={() => onSelectDate(cloneDay)}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={cn(
                "text-[9px] sm:text-[10px] font-semibold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full transition-colors",
                isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {formattedDate}
              </span>
              {dayTasks.length > 0 && (
                <span className="text-[7px] sm:text-[8px] font-black text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">
                  {dayTasks.length}
                </span>
              )}
            </div>

            <ScrollArea className="h-10 sm:h-14">
              <div className="space-y-0.5 pr-0.5 sm:pr-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <motion.div
                    key={task.id}
                    layoutId={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                    className={cn(
                      "task-item group/task p-0.5 sm:p-1 rounded text-[7px] sm:text-[8px] font-medium border border-transparent transition-all cursor-pointer truncate flex items-center gap-0.5 sm:gap-1",
                      task.urgent ? "ring-1 ring-red-500/50 bg-red-500/10 text-red-500 border-red-500/20" : "",
                      task.completed ? "opacity-30 line-through grayscale bg-muted/50 text-muted-foreground" : ""
                    )}
                    style={{ 
                      backgroundColor: !task.urgent && !task.completed ? `${task.color}10` : undefined,
                      borderColor: !task.urgent && !task.completed ? `${task.color}25` : undefined,
                      color: !task.urgent && !task.completed ? task.color : undefined
                    }}
                  >
                    <div 
                      className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full shrink-0" 
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="truncate hidden xs:inline">{task.title}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
            
            <button className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-primary text-primary-foreground hidden sm:block">
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="rounded-xl border border-white/5 overflow-hidden shadow-2xl bg-muted/5 backdrop-blur-sm">{rows}</div>;
  };

  const renderAgenda = () => {
    const agendaTasks = tasks
      .filter(t => !t.completed)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

    return (
      <div className="space-y-6 max-h-[600px] overflow-y-auto px-1 scrollbar-hide">
        {agendaTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-white/10">
            <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>Nenhuma tarefa pendente na agenda.</p>
          </div>
        ) : (
          agendaTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onEditTask(task)}
              className="group relative flex items-center gap-6 p-4 rounded-2xl bg-muted/20 border border-white/5 hover:bg-muted/30 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl bg-background/50 border border-white/5">
                <span className="text-xs font-bold text-muted-foreground uppercase">{format(parseLocalDate(task.date), 'MMM', { locale: ptBR })}</span>
                <span className="text-2xl font-black text-foreground">{format(parseLocalDate(task.date), 'dd')}</span>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }} />
                  <h3 className="font-bold text-lg">{task.title}</h3>
                  {task.urgent && (
                    <Badge className="bg-red-500 hover:bg-red-600 animate-pulse text-[10px]">URGENTE</Badge>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {task.time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {task.time}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {task.category}
                  </div>
                  <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px]">
                    {task.priority || 'Média'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-white/10">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    );
  };

  const renderMobileCalendar = () => {
    // We'll replace the full calendar with a more compact and useful mobile view
    // as requested by the user.

    const weekDays = eachDayOfInterval({
      start: startOfWeek(selectedDate, { locale: ptBR }),
      end: endOfWeek(selectedDate, { locale: ptBR })
    });

    return (
      <div className="flex flex-col h-full">
        {/* Navigation Sidebar for Mobile */}
        <div className="flex gap-2 mb-6">
          <div className="flex flex-col gap-2 w-12 shrink-0">
            <Button 
              variant={view === 'agenda' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => setView('agenda')}
              className={cn("w-10 h-10 rounded-xl", view === 'agenda' ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted/20")}
            >
              <Rows className="w-5 h-5" />
            </Button>
            <Button 
              variant={view === 'month' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => setView('month')}
              className={cn("w-10 h-10 rounded-xl", view === 'month' ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted/20")}
            >
              <CalendarIconSmall className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                onSelectDate(today);
              }}
              className="w-10 h-10 rounded-xl bg-muted/20"
            >
              <span className="text-[10px] font-black">HOJE</span>
            </Button>
          </div>

          <div className="flex-1 space-y-4">
            {/* Horizontal Date Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const hasTasks = tasks.some(t => isSameDay(parseLocalDate(t.date), day));
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => {
                      setSelectedDate(day);
                      onSelectDate(day);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[50px] py-3 rounded-2xl transition-all border",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                        : "bg-muted/10 border-white/5 hover:bg-muted/20"
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase opacity-60 mb-1">
                      {format(day, 'EEE', { locale: ptBR }).replace('.', '')}
                    </span>
                    <span className="text-lg font-black">{format(day, 'd')}</span>
                    {hasTasks && !isSelected && (
                      <div className="w-1 h-1 rounded-full bg-primary mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Daily Agenda */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h3>
              </div>
              
              <ScrollArea className="h-[45vh]">
                <div className="space-y-2 pr-2">
                  {tasks.filter(t => isSameDay(parseLocalDate(t.date), selectedDate)).length === 0 ? (
                    <div className="py-12 text-center rounded-3xl bg-muted/5 border border-dashed border-white/10">
                      <p className="text-xs text-muted-foreground font-medium">Nenhum compromisso.</p>
                      <Button 
                        variant="link" 
                        onClick={() => onSelectDate(selectedDate)}
                        className="text-primary text-[10px] font-black uppercase mt-2 h-auto p-0"
                      >
                        + Adicionar
                      </Button>
                    </div>
                  ) : (
                    tasks
                      .filter(t => isSameDay(parseLocalDate(t.date), selectedDate))
                      .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
                      .map(task => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => onEditTask(task)}
                          className={cn(
                            "p-4 rounded-3xl bg-muted/20 border border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all",
                            task.completed && "opacity-50 grayscale bg-muted/10"
                          )}
                        >
                          <div className={cn(
                            "w-1.5 h-10 rounded-full",
                            task.completed ? "bg-muted-foreground" : ""
                          )} style={{ backgroundColor: !task.completed ? task.color : undefined }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={cn("text-sm font-bold truncate", task.completed && "line-through")}>{task.title}</p>
                              {task.urgent && !task.completed && (
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.time || 'Sem horário'}
                              </span>
                              <span className="text-[10px] text-muted-foreground/40">•</span>
                              <span className="text-[10px] text-muted-foreground font-bold">{task.category}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                             {task.priority === 'Alta' || task.priority === 'Urgente' ? (
                               <Badge className="bg-red-500/10 text-red-500 border-none text-[8px] h-4">!</Badge>
                             ) : null}
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </ScrollArea>
              
              <Button 
                onClick={() => onSelectDate(selectedDate)}
                className="w-full h-12 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-bold gap-2 text-xs"
              >
                <Plus className="w-4 h-4" /> NOVO COMPROMISSO
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(currentMonth);
    const daysInWeek = eachDayOfInterval({
      start: startOfWeekDate,
      end: addDays(startOfWeekDate, 6)
    });

    return (
      <div className="grid grid-cols-7 gap-4">
        {daysInWeek.map((dayOfWeek) => {
          const dayTasks = tasks.filter(t => isSameDay(parseLocalDate(t.date), dayOfWeek));
          return (
            <div key={dayOfWeek.toString()} className="space-y-4">
              <div className={cn(
                "p-4 rounded-2xl flex flex-col items-center gap-1 border border-white/5",
                isToday(dayOfWeek) ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/30"
              )}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {format(dayOfWeek, 'EEEE', { locale: ptBR }).split('-')[0]}
                </span>
                <span className="text-2xl font-black">{format(dayOfWeek, 'd')}</span>
              </div>
              
              <div className="space-y-2">
                {dayTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layoutId={`week-${task.id}`}
                    onClick={() => onEditTask(task)}
                    className={cn(
                      "p-3 rounded-xl border border-white/5 bg-background/50 hover:bg-background/80 transition-all cursor-pointer",
                      task.urgent && "ring-1 ring-red-500/50 shadow-lg shadow-red-500/10"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }} />
                      <span className="text-xs font-bold truncate">{task.title}</span>
                    </div>
                    {task.time && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {task.time}
                      </div>
                    )}
                  </motion.div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full h-8 border-dashed border-white/10 bg-transparent hover:bg-primary/5 text-[10px] font-bold text-muted-foreground"
                  onClick={() => onSelectDate(dayOfWeek)}
                >
                  <Plus className="w-3 h-3 mr-1" /> ADICIONAR
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderHeader()}
      <div className="bg-background/40 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl">
        {view === 'month' && (
          <>
            <div className="hidden sm:block">
              {renderDays()}
              {renderCells()}
            </div>
            <div className="sm:hidden">
              {renderMobileCalendar()}
            </div>
          </>
        )}
        {view === 'week' && renderWeekView()}
        {view === 'agenda' && renderAgenda()}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-slow {
          animation: pulse-red 2s infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

// Helper icons
function Tag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
