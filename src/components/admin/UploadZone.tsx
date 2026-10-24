import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToImageKit } from "@/lib/imagekit";

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  thumbnail?: string;
  url?: string;
  error?: string;
}

interface UploadZoneProps {
  folder: string;
  onUploadComplete: (results: { url: string; file: File }[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export default function UploadZone({ folder, onUploadComplete, disabled, maxFiles = 0 }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (newFiles.length === 0) return;

    const totalAfter = files.length + newFiles.length;
    if (maxFiles > 0 && totalAfter > maxFiles) {
      newFiles.splice(maxFiles - files.length);
    }

    const mapped: UploadingFile[] = newFiles.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      progress: 0,
      status: "pending" as const,
      thumbnail: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...mapped]);
    setStartTime(Date.now());
    processQueue([...files, ...mapped]);
  }, [files, maxFiles]);

  const processQueue = async (allFiles: UploadingFile[]) => {
    const pending = allFiles.filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    const batchSize = 5;
    const completed: { url: string; file: File }[] = [];

    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((item) => uploadFile(item))
      );

      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value) {
          completed.push(result.value);
        }
      });

      setFiles((prev) => [...prev]);
    }

    if (completed.length > 0) onUploadComplete(completed);
  };

  const uploadFile = (item: UploadingFile): Promise<{ url: string; file: File } | null> => {
    return new Promise((resolve) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" as const } : f))
      );

      const startFileTime = Date.now();
      const updateProgress = setInterval(() => {
        setFiles((prev) => prev.map((f) => {
          if (f.id !== item.id) return f;
          const elapsed = Date.now() - startFileTime;
          const fakeProgress = Math.min(f.progress + Math.random() * 15, 90);
          return f.status === "uploading" ? { ...f, progress: fakeProgress } : f;
        }));
      }, 200);

      uploadToImageKit(item.file, folder)
        .then((result) => {
          clearInterval(updateProgress);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, progress: 100, status: "done" as const, url: result.url }
                : f
            )
          );
          resolve({ url: result.url, file: item.file });
        })
        .catch((err) => {
          clearInterval(updateProgress);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "error" as const, error: err.message }
                : f
            )
          );
          resolve(null);
        });
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.thumbnail) URL.revokeObjectURL(f.thumbnail);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const totalFiles = files.length;
  const doneFiles = files.filter((f) => f.status === "done").length;
  const errorFiles = files.filter((f) => f.status === "error").length;
  const uploadingFiles = files.filter((f) => f.status === "uploading").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const totalProgress = totalFiles > 0
    ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / totalFiles)
    : 0;

  const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
  const remaining = doneFiles + uploadingFiles > 0
    ? Math.round((elapsed / (doneFiles + uploadingFiles)) * (totalFiles - doneFiles - errorFiles))
    : 0;

  if (disabled) return null;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Enviar fotos: arraste arquivos ou pressione para selecionar"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors duration-150",
          isDragging
            ? "border-primary bg-accent"
            : "border-input bg-background hover:border-muted-foreground hover:bg-accent"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="space-y-3">
          <div
            className={cn(
              "mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-150",
              isDragging ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-foreground">
              {isDragging ? "Solte as fotos aqui" : "Arraste fotos ou clique para selecionar"}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">PNG, JPG ou WEBP, até 50 MB</p>
          </div>
        </div>
      </div>

      {totalFiles > 0 && (
        <div className="space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[14px]">
            <span className="font-medium text-foreground">
              {doneFiles + errorFiles}/{totalFiles} fotos processadas
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
              {pendingCount > 0 && <span>{pendingCount} pendentes</span>}
              {uploadingFiles > 0 && <span className="text-[hsl(var(--admin-info))]">{uploadingFiles} enviando</span>}
              {doneFiles > 0 && <span className="text-[hsl(var(--admin-success))]">{doneFiles} concluídas</span>}
              {errorFiles > 0 && <span className="text-destructive">{errorFiles} erro</span>}
            </div>
          </div>

          <div
            className="h-1.5 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={totalProgress}
            aria-label="Progresso do envio"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[13px] text-muted-foreground">
            <span>{totalProgress}% concluído</span>
            {uploadingFiles > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                ~{remaining}s restantes
              </span>
            )}
          </div>

          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {files.map((f) => (
              <li key={f.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                {f.thumbnail && (
                  <img
                    src={f.thumbnail}
                    alt={f.file.name}
                    className={cn(
                      "h-full w-full object-cover transition-opacity duration-200",
                      f.status === "done" ? "opacity-100" : "opacity-50"
                    )}
                  />
                )}

                {f.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Enviando" />
                  </div>
                )}

                {f.status === "done" && (
                  <div className="absolute bottom-1 right-1 rounded-full bg-background">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--admin-success))]" aria-label="Concluída" />
                  </div>
                )}

                {f.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/15" title={f.error}>
                    <AlertCircle className="h-5 w-5 text-destructive" aria-label={f.error ? `Erro: ${f.error}` : "Erro no envio"} />
                  </div>
                )}

                {f.status === "pending" && (
                  <div className="absolute inset-0 flex items-end justify-center bg-background/40 pb-1">
                    <span className="rounded bg-background/90 px-1 text-[12px] text-muted-foreground">Aguardando</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                  aria-label={`Remover ${f.file.name} da lista`}
                  className="absolute left-0 top-0 flex h-10 w-10 items-start justify-start p-1 transition-opacity duration-150 sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-accent">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
