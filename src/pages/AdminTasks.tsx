import React, { useState, useMemo } from 'react';
import { useTasks, Task, Priority } from '@/hooks/useTasks';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskSidebar } from '@/components/tasks/TaskSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Plus, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  ChevronRight,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import { useNavigate } from 'react-router-dom';

export default function AdminTasks() {
  const navigate = useNavigate();
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month');
  
  // States for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState<boolean | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority.length === 0 || filterPriority.includes(task.priority);
      const matchesCategory = filterCategory.length === 0 || filterCategory.includes(task.category);
      const matchesCompleted = showCompleted === null || task.completed === showCompleted;
      
      return matchesSearch && matchesPriority && matchesCategory && matchesCompleted;
    });
  }, [tasks, searchQuery, filterPriority, filterCategory, showCompleted]);

  const handleOpenCreateModal = (date?: Date) => {
    setSelectedTask(null);
    setSelectedDate(date || new Date());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleEditFromDetails = () => {
    setIsDetailsOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: any) => {
    if (taskData.id) {
      updateTask.mutate(taskData);
    } else {
      createTask.mutate(taskData);
    }
  };

  const categories = Array.from(new Set(tasks.map(t => t.category)));

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background p-8 gap-8">
        <div className="flex-1 space-y-8">
          <Skeleton className="h-12 w-1/3 rounded-xl" />
          <Skeleton className="h-[600px] w-full rounded-3xl" />
        </div>
        <div className="w-[350px] space-y-8">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 scrollbar-hide">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col lg:flex-row h-screen">
        {/* Navigation Sidebar (Vertical - slim) */}
        <aside className="hidden lg:flex flex-col w-16 xl:w-20 items-center py-6 border-r border-white/5 bg-background/50 backdrop-blur-xl z-20">
          <button 
            onClick={() => navigate("/admin/dashboard")}
            className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-primary flex items-center justify-center mb-10 shadow-lg shadow-primary/20 hover:scale-110 transition-all cursor-pointer"
          >
            <LayoutDashboard className="text-primary-foreground w-5 h-5 xl:w-6 xl:h-6" />
          </button>
          
          <div className="space-y-4 xl:space-y-6 flex-1">
            <nav className="flex flex-col gap-3 xl:gap-4">
              <Button variant="ghost" size="icon" className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl hover:bg-white/5 hover:text-primary transition-all">
                <Bell className="w-4 h-4 xl:w-5 xl:h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <CalendarIcon className="w-4 h-4 xl:w-5 xl:h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl hover:bg-white/5 transition-all"
                onClick={() => navigate("/admin/instagram")}
              >
                <Instagram className="w-4 h-4 xl:w-5 xl:h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl hover:bg-white/5 transition-all">
                <Settings className="w-4 h-4 xl:w-5 xl:h-5" />
              </Button>
            </nav>
          </div>
          
          <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 border border-white/20 shadow-xl" />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-background/20 backdrop-blur-md border-b border-white/5 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/admin/dashboard")}
                className="lg:hidden w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
              <h1 className="text-sm sm:text-base font-black tracking-tight">Planner Pro</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block relative group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Pesquisar..." 
                  className="w-48 xl:w-64 pl-10 bg-muted/30 border-white/5 focus:border-primary/50 transition-all rounded-xl h-10 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 sm:h-10 px-2 sm:px-3 gap-1.5 border-white/5 bg-muted/20 rounded-xl">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Filtros</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-xl border-white/10 p-2 rounded-2xl shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-2">Prioridade</DropdownMenuLabel>
                    {['Baixa', 'Média', 'Alta', 'Urgente'].map((p) => (
                      <DropdownMenuCheckboxItem
                        key={p}
                        checked={filterPriority.includes(p as Priority)}
                        onCheckedChange={() => {
                          setFilterPriority(prev => 
                            prev.includes(p as Priority) 
                              ? prev.filter(x => x !== p) 
                              : [...prev, p as Priority]
                          );
                        }}
                        className="rounded-lg mb-1"
                      >
                        {p}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator className="bg-white/5 my-2" />
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-2">Status</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={showCompleted === true}
                      onCheckedChange={() => setShowCompleted(showCompleted === true ? null : true)}
                      className="rounded-lg"
                    >
                      Concluídas
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={showCompleted === false}
                      onCheckedChange={() => setShowCompleted(showCompleted === false ? null : false)}
                      className="rounded-lg"
                    >
                      Pendentes
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  onClick={() => handleOpenCreateModal()}
                  className="h-9 sm:h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl px-3 sm:px-4 gap-1.5 text-xs sm:text-sm font-bold"
                >
                  <Plus className="w-4 h-4" /> 
                  <span className="hidden xs:inline">Novo</span>
                  <span className="xs:hidden">Tarefa</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Scrollable Calendar Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-hide">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-6xl mx-auto"
              >
                <TaskCalendar 
                  tasks={filteredTasks}
                  onSelectDate={(date) => handleOpenCreateModal(date)}
                  onEditTask={(task) => handleOpenEditModal(task)}
                  view={view}
                  setView={setView}
                />
              </motion.div>
            </div>

            {/* Right Sidebar Area - Desktop Only */}
            <aside className="hidden lg:block w-[280px] xl:w-[320px] border-l border-white/5 bg-background/30 backdrop-blur-md overflow-y-auto p-6 scrollbar-hide z-10 shrink-0">
              <TaskSidebar 
                tasks={tasks}
                onSelectTask={(task) => handleOpenEditModal(task)}
              />
            </aside>
          </div>
        </main>

        {/* Floating Add Button for Mobile */}
        <Button 
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary shadow-2xl flex items-center justify-center p-0 z-50 hover:scale-110 active:scale-95 transition-all"
          onClick={() => handleOpenCreateModal()}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Modals */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        onEdit={handleEditFromDetails}
        onDelete={(id) => deleteTask.mutate(id)}
        onAddAnother={(date) => handleOpenCreateModal(date)}
      />

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={(id) => deleteTask.mutate(id)}
        initialTask={selectedTask}
        initialDate={selectedDate}
      />

      {/* Global Toast / Notification styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        ::selection { background: hsl(var(--primary) / 0.3); color: white; }
      `}} />
    </div>
  );
}

// Re-using Lucide components localized
function CalendarIcon(props: any) {
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
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
