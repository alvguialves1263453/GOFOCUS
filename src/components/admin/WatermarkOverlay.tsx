import type { Evento, WatermarkPosition, WatermarkSize } from "@/types/eventos";

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

export default function WatermarkOverlay({ evento, className = "" }: { evento: Evento; className?: string }) {
  if (!evento.watermark_enabled || !evento.watermark_image) return null;

  const opacity = (evento.watermark_opacity ?? 50) / 100;
  const size = sizePercent[evento.watermark_size as WatermarkSize || "media"];
  const pos = (evento.watermark_position as WatermarkPosition) || "centro";

  if (pos === "repetido") {
    return (
      <div
        className={`absolute inset-0 pointer-events-none select-none ${className}`}
        style={{
          backgroundImage: `url(${evento.watermark_image})`,
          backgroundRepeat: "repeat",
          backgroundSize: `${evento.watermark_spacing || 16}%`,
          opacity,
        }}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 flex pointer-events-none select-none ${className}`}
      style={positionStyles[pos]}
    >
      <img
        src={evento.watermark_image}
        alt=""
        className="pointer-events-none select-none"
        style={{
          width: size,
          opacity,
          maxWidth: size,
          height: "auto",
        }}
      />
    </div>
  );
}
