import { thumb } from "./homeData";

interface PhotoStripProps {
  photos: string[];
  title: string;
  caption: string;
  /** Pixel width of each frame request, so strips in a grid stay light. */
  imageWidth?: number;
  eager?: boolean;
  className?: string;
}

/**
 * A printed photo-booth strip: four frames stacked on photo paper with the
 * album printed at the foot. Pure markup; the parent decides how it moves.
 */
export default function PhotoStrip({ photos, title, caption, imageWidth = 420, eager, className = "" }: PhotoStripProps) {
  const frames = photos.slice(0, 4);
  return (
    <figure
      className={`flex flex-col gap-[6%] rounded-[3px] bg-[#FBFAF7] p-[7%] pb-[9%] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.18)] ${className}`}
    >
      {frames.map((src, i) => (
        <div key={`${src}-${i}`} className="aspect-[5/4] w-full overflow-hidden bg-[#1a1a1a]">
          <img
            src={thumb(src, imageWidth)}
            alt=""
            width={imageWidth}
            height={Math.round(imageWidth * 0.8)}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
      <figcaption className="mt-[2%] text-center">
        <span className="block truncate font-marquee text-[clamp(1rem,1.6vw,1.35rem)] font-extrabold uppercase leading-none tracking-[0.02em] text-[#141414]">
          {title}
        </span>
        <span className="mt-1.5 block font-archivo text-[11px] leading-none text-[#55524C] [font-stretch:87%]">{caption}</span>
      </figcaption>
    </figure>
  );
}
