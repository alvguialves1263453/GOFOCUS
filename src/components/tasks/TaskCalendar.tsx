import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval, isToday, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MoreHorizontal,
  Rows,
  CalendarDays,
  Calendar as CalendarIconSmall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/hooks/useTasks';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';

// Helper to parse YYYY-MM-DD string to local Date object
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

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
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Helper to get modifier dates for dots
  const taskDates = tasks.map(t => parseLocalDate(t.date));

  const renderHeader = () => {
    return (
      <div className="flex flex-col gap-4 mb-6 px-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-black text-foreground capitalize tracking-tight">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">
              {tasks.filter(t => isSameMonth(parseLocalDate(t.date), currentMonth)).length} {tasks.filter(t => isSameMonth(parseLocalDate(t.date), currentMonth)).length === 1 ? 'compromisso' : 'compromissos'} no mês
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-xl bg-muted/20 border border-white/5">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-xl bg-muted/20 border border-white/5">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Selection Toggle */}
        <div className="flex items-center bg-muted/20 p-1.5 rounded-2xl border border-white/5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setView('agenda'); setShowFullCalendar(false); }}
            className={cn("flex-1 h-9 gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", (view === 'agenda' && !showFullCalendar) && "bg-white text-black shadow-lg")}
          >
            Hoje
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setView('week'); setShowFullCalendar(false); }}
            className={cn("flex-1 h-9 gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", (view === 'week' && !showFullCalendar) && "bg-white text-black shadow-lg")}
          >
            Semana
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setView('month'); setShowFullCalendar(false); }}
            className={cn("flex-1 h-9 gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", (view === 'month' && !showFullCalendar) && "bg-white text-black shadow-lg")}
          >
            Mês
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
          <div key={day} className="text-center text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] py-2">
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    const agendaTasks = tasks
      .filter(t => !t.completed)
      .filter(t => isMobile ? isSameMonth(parseLocalDate(t.date), currentMonth) : true)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

    return (
      <div className="space-y-4 max-h-[600px] overflow-y-auto px-2 scrollbar-hide py-2 pb-20">
        {agendaTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-white/10">
            <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold">Nenhum compromisso pendente.</p>
          </div>
        ) : (
          agendaTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onEditTask(task)}
              className="group relative flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-white/5 hover:bg-muted/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex flex-col items-center justify-center min-w-[54px] p-2 rounded-xl bg-background/50 border border-white/5 shadow-inner">
                <span className="text-[10px] font-black text-muted-foreground uppercase">{format(parseLocalDate(task.date), 'MMM', { locale: ptBR })}</span>
                <span className="text-xl font-black text-foreground leading-none mt-0.5">{format(parseLocalDate(task.date), 'dd')}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: task.color }} />
                  <h3 className="font-bold text-sm truncate">{task.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                   {task.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.time}
                    </div>
                   )}
                   <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {task.category}
                   </div>
                </div>
              </div>
              
              <ChevronRight className="w-4 h-4 text-white/5 transition-transform group-hover:translate-x-1" />
            </motion.div>
          ))
        )}
      </div>
    );
  };

  const renderMobileCalendar = () => {
    return (
      <div className="relative h-full w-full flex flex-col items-center py-4">
        {/* Toggleable Sidebar for Mobile */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex flex-col items-start gap-3 pointer-events-none">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsToolbarOpen(!isToolbarOpen)}
            className="w-10 h-10 rounded-r-xl bg-white/10 hover:bg-white/20 text-white border border-white/5 border-l-0 pointer-events-auto shadow-xl backdrop-blur-md"
          >
            <MoreHorizontal className={cn("w-5 h-5 transition-transform", isToolbarOpen ? "rotate-90" : "rotate-0")} />
          </Button>

          <AnimatePresence>
            {isToolbarOpen && (
              <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="flex flex-col gap-2 pointer-events-auto"
              >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setShowFullCalendar(false); setView('agenda'); setIsToolbarOpen(false); }}
                    className={cn("w-12 h-12 rounded-r-2xl transition-all shadow-xl bg-muted/60 backdrop-blur-md border border-white/5 border-l-0", (!showFullCalendar) ? "bg-white text-black" : "text-white/40")}
                  >
                    <Rows className="w-6 h-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setShowFullCalendar(true); setIsToolbarOpen(false); }}
                    className={cn("w-12 h-12 rounded-r-2xl transition-all shadow-xl bg-muted/60 backdrop-blur-md border border-white/5 border-l-0", showFullCalendar ? "bg-white text-black" : "text-white/40")}
                  >
                    <CalendarIconSmall className="w-6 h-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { goToToday(); setIsToolbarOpen(false); }}
                    className="w-12 h-12 rounded-r-2xl bg-primary/20 text-primary shadow-xl backdrop-blur-md border border-primary/20 border-l-0 font-black text-[10px]"
                  >
                    HOJE
                  </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full h-full">
          <AnimatePresence mode="wait">
            {showFullCalendar ? (
              <motion.div 
                key="calendar-picker"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full px-4"
              >
                <div className="bg-muted/10 rounded-[40px] p-6 border border-white/5 backdrop-blur-xl w-full max-w-[340px] shadow-2xl">
                   <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          onSelectDate(date);
                          setShowFullCalendar(false);
                        }
                      }}
                      initialFocus
                      className="p-0 border-none w-full"
                      components={{
                        DayContent: ({ date }) => {
                          const hasTasks = tasks.filter(t => isSameDay(parseLocalDate(t.date), date));
                          return (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <span>{date.getDate()}</span>
                              {hasTasks.length > 0 && (
                                <div className="absolute bottom-1 flex gap-0.5">
                                  {hasTasks.slice(0, 3).map((t, idx) => (
                                    <div 
                                      key={idx} 
                                      className="w-1 h-1 rounded-full" 
                                      style={{ backgroundColor: t.color || '#fff' }} 
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                      }}
                   />
                </div>
                <p className="text-[10px] font-black uppercase text-center tracking-[0.4em] text-white/20 mt-8">
                   Selecione um dia para agendar
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="agenda-month"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                {renderAgenda()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeekDate = startOfWeek(currentMonth);
    const daysInWeek = eachDayOfInterval({
      start: startOfWeekDate,
      end: addDays(startOfWeekDate, 6)
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
        {daysInWeek.map((dayOfWeek) => {
          const dayTasks = tasks.filter(t => isSameDay(parseLocalDate(t.date), dayOfWeek));
          return (
            <div key={dayOfWeek.toString()} className="space-y-4">
              <div className={cn(
                "p-4 rounded-2xl flex flex-col items-center gap-1 border border-white/5 transition-all text-center",
                isToday(dayOfWeek) ? "bg-white text-black shadow-lg" : "bg-muted/10"
              )}>
                <span className={cn("text-[9px] font-black uppercase tracking-wider opacity-60", isToday(dayOfWeek) && "opacity-40")}>
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
                      "p-3 rounded-2xl border border-white/5 bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer",
                      task.urgent && "ring-1 ring-red-500/50 shadow-lg shadow-red-500/10"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.color }} />
                      <span className="text-xs font-bold truncate">{task.title}</span>
                    </div>
                    {task.time && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {task.time}
                      </div>
                    )}
                  </motion.div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full h-10 border-dashed border-white/10 bg-transparent hover:bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground"
                  onClick={() => onSelectDate(dayOfWeek)}
                >
                  <Plus className="w-3 h-3 mr-2" /> ADICIONAR
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
      <div className="bg-muted/5 backdrop-blur-sm rounded-[32px] p-2 sm:p-6 border border-white/5">
        <div className="hidden sm:block">
           {view === 'month' && (
              <>
                {renderDays()}
                {renderCells()}
              </>
            )}
            {view === 'week' && renderWeekView()}
            {view === 'agenda' && renderAgenda()}
        </div>
        <div className="sm:hidden min-h-[500px]">
           {renderMobileCalendar()}
        </div>
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

        /* Customize Shadcn Calendar for our Dark Premium Look */
        .rdp-day_selected { 
          background-color: white !important; 
          color: black !important;
          border-radius: 12px !important;
        }
        .rdp-day_today {
          color: white !important;
          font-weight: 800 !important;
          text-decoration: underline underline-offset-4 !important;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(255,255,255,0.05) !important;
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
