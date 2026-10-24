import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "./homeData";

export interface BoothCameraHandle {
  /** Fires the softbox; the page's own flash is the parent's call. */
  flash: () => void;
}

interface BoothCameraProps {
  /** 3, 2, 1 while counting; null when idle. */
  count: number | null;
  busy: boolean;
}

const SCREWS = ["left-3 top-3", "right-3 top-3", "bottom-3 left-3", "bottom-3 right-3"];

/**
 * The booth's camera head, drawn in CSS: graphite housing, frosted flash
 * softbox, a machined lens with coated glass, an LED countdown and a tally
 * lamp. Only transforms and opacity animate, so it stays cheap in Safari.
 */
const BoothCamera = forwardRef<BoothCameraHandle, BoothCameraProps>(function BoothCamera({ count, busy }, ref) {
  const glow = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  const tally = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    flash: () => {
      if (!glow.current || prefersReducedMotion()) return;
      gsap.fromTo(glow.current, { opacity: 1 }, { opacity: 0, duration: 0.7, ease: "power2.out", delay: 0.05 });
    },
  }));

  // Each count, the lens hunts for focus and the tally lamp blinks.
  useEffect(() => {
    if (count == null || prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(glass.current, { scale: 0.94 }, { scale: 1, duration: 0.45, ease: "back.out(2.5)" }, 0).fromTo(
      tally.current,
      { opacity: 1 },
      { opacity: 0.25, duration: 0.3, ease: "power1.in", yoyo: true, repeat: 1 },
      0
    );
    return () => {
      tl.kill();
    };
  }, [count]);

  return (
    <div className="relative rounded-[30px] bg-[linear-gradient(100deg,#232427_0%,#2e3034_18%,#1b1c1f_42%,#2a2c30_68%,#18191b_100%)] p-5 shadow-[0_34px_70px_-30px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-2px_0_rgba(0,0,0,0.6)] sm:p-6">
      {/* Corner screws. */}
      {SCREWS.map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`absolute ${pos} grid h-3 w-3 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#d7d9dc,#6f7277_70%)] shadow-[0_1px_1px_rgba(0,0,0,0.6)]`}
        >
          <span className="h-[1.5px] w-2 rotate-[35deg] rounded bg-[#3c3e42]" />
        </span>
      ))}

      {/* Flash softbox: milky panel that blazes white when the shot is taken. */}
      <div className="relative mx-auto h-11 w-[78%] overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,#e9eaec,#c9ccd0)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.15)] sm:h-12">
        <div aria-hidden="true" className="absolute inset-x-3 inset-y-2 rounded-[10px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.85),rgba(255,255,255,0)_70%)]" />
        <div ref={glow} aria-hidden="true" className="absolute inset-0 bg-white opacity-0 shadow-[0_0_40px_20px_rgba(255,255,255,0.9)]" />
      </div>

      {/* Lens assembly. */}
      <div className="relative mx-auto mt-5 aspect-square w-[64%] sm:w-[68%]">
        {/* Machined bezel. */}
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,#f4f5f6,#9a9ea4_12%,#e7e8ea_25%,#7b7f85_40%,#d9dbde_55%,#8c9096_70%,#f1f2f3_85%,#9a9ea4)] shadow-[0_12px_28px_-10px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
        {/* Black focus ring. */}
        <div className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle,#0b0b0c_58%,#1d1e21_74%,#0b0b0c_100%)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.08)]" />
        {/* Barrel steps going down into the lens. */}
        <div className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle,#050506_60%,#26282c_68%,#0a0a0b_76%,#2b2d31_84%,#09090a_92%)]" />
        {/* Coated front element. */}
        <div
          ref={glass}
          className="absolute inset-[26%] overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_55%,#04050a_25%,#121b33_55%,#2b1d46_75%,#0d1424_100%)] shadow-[inset_0_0_18px_rgba(0,0,0,0.9)]"
        >
          {/* Aperture blades seen through the glass. */}
          <div className="absolute inset-[22%] rounded-full bg-[conic-gradient(from_15deg,#0c0d10_0_14%,#15171c_14%_28%,#0c0d10_28%_42%,#15171c_42%_57%,#0c0d10_57%_71%,#15171c_71%_85%,#0c0d10_85%)] opacity-90" />
          <div className="absolute inset-[40%] rounded-full bg-[#020203]" />
          {/* Coating reflections. */}
          <div className="absolute left-[18%] top-[14%] h-[30%] w-[38%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.55),rgba(255,255,255,0)_70%)]" />
          <div className="absolute bottom-[16%] right-[20%] h-[14%] w-[18%] rounded-full bg-[radial-gradient(ellipse,rgba(160,120,255,0.45),rgba(160,120,255,0)_70%)]" />
          <div className="absolute bottom-[26%] left-[24%] h-[9%] w-[12%] rounded-full bg-[radial-gradient(ellipse,rgba(90,220,200,0.35),rgba(90,220,200,0)_70%)]" />
        </div>
      </div>

      {/* Status row: tally lamp, LED countdown, instruction. */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            ref={tally}
            aria-hidden="true"
            className={`h-3 w-3 rounded-full transition-[background-color,box-shadow] duration-200 ${
              busy ? "bg-[#ff4d3d] shadow-[0_0_10px_3px_rgba(255,77,61,0.65)]" : "bg-[#3a3b3e] shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]"
            }`}
          />
          <span className="font-archivo text-[13px] text-[#C9CCD1]">{busy ? "Gravando" : "Olhe para a lente"}</span>
        </span>
        <span className="grid h-10 min-w-[64px] place-items-center rounded-[8px] bg-[#0a0f0c] px-3 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.08)]">
          <span
            aria-live="polite"
            className={`font-marquee text-[1.7rem] font-black leading-none tabular-nums ${count != null ? "text-[#ff4d3d] [text-shadow:0_0_8px_rgba(255,77,61,0.7)]" : "text-[#3a1a17]"}`}
          >
            {count ?? 0}
          </span>
        </span>
      </div>

      {/* Maker's plate. */}
      <div className="mx-auto mt-4 w-fit rounded-[6px] bg-[linear-gradient(180deg,#d4d6d9,#9fa3a8)] px-4 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.6)]">
        <span className="font-marquee text-[13px] font-extrabold uppercase leading-none tracking-[0.06em] text-[#2a2c30]">GoFocus, cabine de fotos</span>
      </div>

      {/* Print slot: chrome lip over a dark gap. */}
      <div className="relative mx-auto mt-5 h-4 w-[72%] rounded-full bg-[linear-gradient(180deg,#e2e4e6,#8f9398)] p-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
        <div className="h-full w-full rounded-full bg-[linear-gradient(180deg,#000,#1b1b1d)] shadow-[inset_0_2px_3px_rgba(0,0,0,0.95)]" />
      </div>
    </div>
  );
});

export default BoothCamera;
