import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Star, Trash2, Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin"); return; }
    setLoading(false);
    navigate("/admin/dashboard"); // Redirect as projects are no longer available
  }, [user, authLoading, id, navigate]);

  const handleAddPhotos = async (fileList: FileList | null) => {
    toast.info("Ações de banco de dados desativadas");
  };

  const handleRemovePhoto = async (photo: any) => {
    toast.info("Ações de banco de dados desativadas");
  };

  const handleSetCover = async (imageUrl: string) => {
    toast.info("Ações de banco de dados desativadas");
  };

  const handleDownload = (url: string, index: number) => {
    window.open(url, "_blank");
  };

  const handleCopyLink = () => {
    toast.info("Ações de banco de dados desativadas");
  };

  const handleNameChange = async (name: string) => {
    if (!project) return;
    setProject({ ...project, title: name });
  };

  const handleNameBlur = async () => {
    toast.info("Ações de banco de dados desativadas");
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return null;
};

export default AdminProjectEdit;
