import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tag, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2, Plus, X, Trash2 } from 'lucide-react';
import { Task, TaskInsert, Priority, ChecklistItem } from '@/hooks/useTasks';
import { format, parseISO, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const TIME_ZONE = 'America/Sao_Paulo';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  onDelete?: (id: string) => void;
  initialTask?: Task | null;
  initialDate?: Date;
}

const CATEGORIES = [
  'Trabalho', 'Cliente', 'Financeiro', 'Marketing', 'Pessoal', 'Desenvolvimento', 'Geral'
];

const PRIORITIES: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

const COLORS = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Laranja', value: '#F59E0B' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Slate', value: '#64748B' },
];

export function TaskModal({ isOpen, onClose, onSave, onDelete, initialTask, initialDate }: TaskModalProps) {
  const getCurrentLocalDate = () => formatInTimeZone(startOfDay(new Date()), TIME_ZONE, 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getCurrentLocalDate());
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Geral');
  const [priority, setPriority] = useState<Priority>('Média');
  const [color, setColor] = useState('#3B82F6');
  const [urgent, setUrgent] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setDate(initialTask.date || '');
      setTime(initialTask.time || '');
      setCategory(initialTask.category || 'Geral');
      setPriority(initialTask.priority || 'Média');
      setColor(initialTask.color || '#3B82F6');
      setUrgent(initialTask.urgent || false);
      setTags(initialTask.tags || []);
      setChecklist(initialTask.checklist || []);
      setCompleted(initialTask.completed || false);
    } else if (initialDate) {
      // Ensure initialDate is treated as the correct local date string
      const dateStr = formatInTimeZone(startOfDay(initialDate), TIME_ZONE, 'yyyy-MM-dd');
      setDate(dateStr);
      setTitle('');
      setDescription('');
      setTime('');
      setCategory('Geral');
      setPriority('Média');
      setColor('#3B82F6');
      setUrgent(false);
      setTags([]);
      setChecklist([]);
      setCompleted(false);
    }
  }, [initialTask, initialDate, isOpen]);

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, { id: Math.random().toString(36).substr(2, 9), text: '', completed: false }]);
  };

  const updateChecklistItem = (id: string, text: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, text } : item));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const taskData: any = {
      title,
      description,
      date,
      time: time || null,
      category,
      priority,
      color,
      urgent,
      tags,
      checklist,
      completed,
    };

    if (initialTask) {
      taskData.id = initialTask.id;
    }

    onSave(taskData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {initialTask ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
            {initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião com cliente"
              className="bg-muted/50 border-white/5 focus:border-primary/50 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 bg-muted/50 border-white/5 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Horário (Opcional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10 bg-muted/50 border-white/5"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-muted/50 border-white/5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="bg-muted/50 border-white/5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Cor do Card</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-primary scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-white/5">
            <Checkbox
              id="urgent"
              checked={urgent}
              onCheckedChange={(checked) => setUrgent(checked === true)}
            />
            <Label htmlFor="urgent" className="flex items-center gap-2 cursor-pointer text-sm font-bold text-red-500">
              <AlertTriangle className="w-4 h-4" /> Marcar como URGENTE
            </Label>
            
            <div className="ml-auto flex items-center space-x-2">
              <Checkbox
                id="completed"
                checked={completed}
                onCheckedChange={(checked) => setCompleted(checked === true)}
              />
              <Label htmlFor="completed" className="cursor-pointer text-sm font-medium">Concluída</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição / Observações</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
              className="bg-muted/50 border-white/5 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Checklist</Label>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                    placeholder="Item do checklist..."
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 h-8 text-sm"
                  />
                  <button type="button" onClick={() => removeChecklistItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addChecklistItem}
                className="w-full justify-start text-xs text-muted-foreground hover:text-primary"
              >
                <Plus className="w-3 h-3 mr-2" /> Adicionar item
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1 bg-primary/10 text-primary border-primary/20">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Adicionar tag..."
                className="bg-muted/50 border-white/5 h-9"
              />
              <Button type="button" size="sm" onClick={handleAddTag} variant="outline" className="shrink-0">
                <Tag className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center sm:justify-between px-0 pt-4 border-t border-white/10">
            {initialTask && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(initialTask.id);
                  onClose();
                }}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">
                {initialTask ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
