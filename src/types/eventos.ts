export interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_evento: string | null;
  local: string | null;
  capa_url: string | null;
  preco_foto: number;
  status: string;
  created_at: string;
  watermark_enabled?: boolean;
  watermark_image?: string | null;
  watermark_opacity?: number;
  watermark_size?: string;
  watermark_position?: string;
  watermark_spacing?: number;
}

export type WatermarkPosition = "centro" | "superior-esquerda" | "superior-direita" | "inferior-esquerda" | "inferior-direita" | "repetido";
export type WatermarkSize = "pequena" | "media" | "grande";

export interface Foto {
  id: string;
  evento_id: string;
  url_original: string;
  url_thumbnail: string | null;
  url_watermark: string | null;
  ordem: number;
  largura?: number | null;
  altura?: number | null;
  tamanho_bytes?: number | null;
}

export interface EventoComFotos extends Evento {
  foto_count: number;
}

export type BillingType = "pix" | "credit_card" | "boleto";

export interface Pedido {
  id: string;
  cliente_id: string;
  evento_id: string;
  valor_total: number;
  status: "aguardando" | "pago" | "cancelado" | "reembolsado";
  metodo_pagamento?: BillingType;
  pix_qrcode_image_url?: string;
  pix_qrcode_text?: string;
  asaas_invoice_url?: string;
  asaas_payment_id?: string;
  created_at: string;
  paid_at?: string;
  evento?: Evento;
}

const positionStyles: Record<WatermarkPosition, React.CSSProperties> = {
  "centro": { justifyContent: "center", alignItems: "center" },
  "superior-esquerda": { justifyContent: "flex-start", alignItems: "flex-start" },
  "superior-direita": { justifyContent: "flex-end", alignItems: "flex-start" },
  "inferior-esquerda": { justifyContent: "flex-start", alignItems: "flex-end" },
  "inferior-direita": { justifyContent: "flex-end", alignItems: "flex-end" },
  "repetido": {},
};

const sizePercent: Record<WatermarkSize, string> = {
  pequena: "12%",
  media: "25%",
  grande: "45%",
};


export interface UploadProgress {
  loaded: number;
  total: number;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export interface UploadState {
  files: UploadProgress[];
  startTime: number | null;
}
