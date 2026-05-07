import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Plus,
  ArrowRight,
  Hash,
  Share2,
  Download,
  MessageCircle,
} from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onAddAnother: (date: Date) => void;
}

export function TaskDetailsModal({ isOpen, onClose, task, onEdit, onDelete, onAddAnother }: TaskDetailsModalProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  if (!task) return null;

  const handleShareImage = async () => {
    if (!contentRef.current) return;
    setIsSharing(true);
    try {
      const dataUrl = await htmlToImage.toPng(contentRef.current, {
        cacheBust: true,
        backgroundColor: '#050505',
        style: {
          borderRadius: '0',
          transform: 'scale(1)',
        }
      });
      
      const link = document.createElement('a');
      link.download = `agendamento-${task.title}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Imagem gerada e download iniciado!');
    } catch (err) {
      console.error('Error generating image:', err);
      toast.error('Erro ao gerar imagem.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareWhatsApp = () => {
    const dateStr = format(new Date(task.date), "dd/MM/yyyy", { locale: ptBR });
    const text = `📌 *Agendamento Confirmado*\n\n📅 *Dia:* ${dateStr}${task.time ? `\n⏰ *Hora:* ${task.time}` : ''}\n📝 *Tarefa:* ${task.title}\n📂 *Categoria:* ${task.category}\n\n${task.description ? `*Descrição:* ${task.description}\n\n` : ''}🔗 *Link:* ${window.location.origin}/admin/planner?id=${task.id}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleWebShare = async () => {
    if (!contentRef.current) return;
    setIsSharing(true);
    try {
      const blob = await htmlToImage.toBlob(contentRef.current);
      if (!blob) throw new Error('No blob');
      
      const file = new File([blob], `agendamento-${task.title}.png`, { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: `Agendamento: ${task.title}`,
          text: `Agendamento para o dia ${format(new Date(task.date), "dd/MM/yyyy")}`,
          files: [file]
        });
      } else {
        handleShareImage();
      }
    } catch (err) {
      handleShareWhatsApp();
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-background/95 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden rounded-3xl">
        <div ref={contentRef} className="bg-[#050505]">
          {/* Header with Color Banner */}
          <div 
            className="h-24 w-full relative"
            style={{ backgroundColor: `${task.color}20` }}
          >
          <div 
            className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent" 
          />
          <Badge 
            className="absolute top-4 right-4 gap-1.5 py-1 px-3 border-none font-black text-[10px] tracking-widest uppercase"
            style={{ backgroundColor: task.color, color: 'white' }}
          >
            {task.category}
          </Badge>
          
          {task.urgent && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full text-[10px] font-black text-white animate-pulse shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-3 h-3" /> URGENTE
            </div>
          )}
        </div>

        <div className="px-8 pb-8 -mt-6 relative z-10">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {format(new Date(task.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
              {task.time && (
                <>
                  <span className="opacity-30">•</span>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">{task.time}</span>
                </>
              )}
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight leading-none mb-4">
              {task.title}
            </DialogTitle>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] py-0.5 px-2">
                Prioridade: {task.priority}
              </Badge>
              {task.completed && (
                <Badge className="bg-green-500/20 text-green-500 border-none text-[10px] py-0.5 px-2">
                  CONCLUÍDA
                </Badge>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-6">
              {task.description && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Descrição</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-2xl border border-white/5">
                    {task.description}
                  </p>
                </div>
              )}

              {task.checklist && task.checklist.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Checklist</h4>
                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-white/5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${item.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-white/10'}`}>
                          {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs font-medium ${item.completed ? 'line-through opacity-40' : ''}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary border-primary/10 gap-1 text-[10px] font-bold">
                        <Hash className="w-3 h-3" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="px-8 pb-8">
          <Separator className="my-6 bg-white/5" />

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <Button 
                variant="outline"
                onClick={handleWebShare}
                disabled={isSharing}
                className="h-10 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 gap-2 text-xs"
              >
                {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                Compartilhar
              </Button>
              <Button 
                variant="outline"
                onClick={handleShareWhatsApp}
                className="h-10 rounded-xl border-white/5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all gap-2 text-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </Button>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={onEdit}
                className="flex-1 h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-bold gap-2 text-sm"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </Button>
              <Button 
                variant="outline"
                size="icon"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="w-12 h-12 rounded-2xl border-white/5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              variant="ghost"
              onClick={() => {
                onClose();
                onAddAnother(new Date(task.date));
              }}
              className="h-10 text-muted-foreground hover:text-primary transition-all gap-2 text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Adicionar outro para este dia
              <ArrowRight className="w-3 h-3 ml-auto opacity-30" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Loader2(props: any) {
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
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
