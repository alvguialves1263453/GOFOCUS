import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitType?: "chars" | "words" | "lines";
  from?: object;
  to?: object;
  threshold?: number;
  rootMargin?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: "left" | "center" | "right";
  scrollTrigger?: boolean;
  onComplete?: () => void;
}

export default function SplitText({
  text,
  className = "",
  delay = 30,
  duration = 0.8,
  splitType = "chars",
  from = { opacity: 0, y: 40, rotateX: -15 },
  to = { opacity: 1, y: 0, rotateX: 0 },
  threshold = 0.15,
  rootMargin = "-50px",
  tag = "p",
  textAlign = "center",
  scrollTrigger: useScrollTrigger = true,
  onComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts?.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts?.ready?.then(() => setFontsLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!ref.current || !text || !fontsLoaded) return;

    const el = ref.current;
    el.innerHTML = "";

    const split = new GSAPSplitText(el, {
      type: splitType,
      charsClass: "split-char",
      wordsClass: "split-word",
      linesClass: "split-line",
    });

    let targets: Element[] = [];
    if (splitType === "chars") targets = split.chars || [];
    else if (splitType === "words") targets = split.words || [];
    else targets = split.lines || [];

    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      const animation = gsap.fromTo(targets, from, {
        ...to,
        duration,
        ease: "power3.out",
        stagger: delay / 1000,
        ...(useScrollTrigger
          ? {
              scrollTrigger: {
                trigger: el,
                start: `top ${(1 - threshold) * 100}%`,
                end: "bottom 20%",
                toggleActions: "play none none reverse",
                once: true,
              },
            }
          : {}),
        onComplete,
      });

      if (!useScrollTrigger) {
        animation.play();
      }
    }, ref);

    return () => ctx.revert();
  }, [text, delay, duration, splitType, fontsLoaded, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin, useScrollTrigger, onComplete]);

  const Tag = tag as keyof JSX.IntrinsicElements;

  return (
    <Tag ref={ref} className={`split-parent inline-block ${className}`} style={{ textAlign } as React.CSSProperties}>
      {text}
    </Tag>
  );
}
