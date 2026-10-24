"use client";

import React, { useMemo, type HTMLAttributes } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  perspective?: number;
  beamsPerSide?: number;
  beamSize?: number;
  beamDelayMax?: number;
  beamDelayMin?: number;
  beamDuration?: number;
  gridColor?: string;
}

const Beam = ({
  index,
  width,
  x,
  delay,
  duration,
}: {
  index: number;
  width: string | number;
  x: string | number;
  delay: number;
  duration: number;
}) => {
  // Deterministic hues (indigo / violet / cyan / amber) matching the theme and avoiding SSR hydration mismatches
  const hue = (index * 67 + 220) % 360;
  const ar = ((index * 3) % 7) + 2;

  return (
    <motion.div
      style={
        {
          left: `${x}`,
          width: `${width}`,
          aspectRatio: `1 / ${ar}`,
          background: `linear-gradient(hsl(${hue} 85% 65%), transparent)`,
        } as React.CSSProperties
      }
      className="absolute top-0 pointer-events-none"
      initial={{ y: "100cqmax", x: "-50%" }}
      animate={{ y: "-100%", x: "-50%" }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 100,
  className,
  beamsPerSide = 3,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3,
  gridColor = "var(--border-subtle)",
  ...props
}) => {
  const generateBeams = (offset: number) => {
    const beams = [];
    const cellsPerSide = Math.floor(100 / beamSize);
    const step = cellsPerSide / beamsPerSide;

    for (let i = 0; i < beamsPerSide; i++) {
      const x = Math.floor(i * step);
      // Deterministic delays to ensure clean hydration
      const delay = ((i + offset) % 4) * 0.75;
      beams.push({ x, delay });
    }
    return beams;
  };

  const topBeams = useMemo(() => generateBeams(0), [beamsPerSide, beamSize]);
  const rightBeams = useMemo(() => generateBeams(1), [beamsPerSide, beamSize]);
  const bottomBeams = useMemo(() => generateBeams(2), [beamsPerSide, beamSize]);
  const leftBeams = useMemo(() => generateBeams(3), [beamsPerSide, beamSize]);

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <div
        style={
          {
            "--perspective": `${perspective}px`,
            "--grid-color": gridColor,
            "--beam-size": `${beamSize}%`,
            perspective: `${perspective}px`,
          } as React.CSSProperties
        }
        className="@container-[size] pointer-events-none absolute inset-0 size-full overflow-hidden [clip-path:inset(0)] [perspective:var(--perspective)] [transform-style:preserve-3d]"
      >
        {/* Top wall */}
        <div
          style={{
            backgroundImage: `linear-gradient(var(--grid-color) 0 1px, transparent 1px var(--beam-size)), linear-gradient(90deg, var(--grid-color) 0 1px, transparent 1px var(--beam-size))`,
            backgroundSize: `var(--beam-size) var(--beam-size)`,
            backgroundPosition: `50% -0.5px, 50% 50%`,
          }}
          className="@container absolute z-10 h-[100cqmax] w-[100cqi] origin-[50%_0%] [transform:rotateX(-90deg)] [transform-style:preserve-3d] opacity-40 dark:opacity-50"
        >
          {topBeams.map((beam, index) => (
            <Beam
              key={`top-${index}`}
              index={index}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>

        {/* Bottom wall */}
        <div
          style={{
            backgroundImage: `linear-gradient(var(--grid-color) 0 1px, transparent 1px var(--beam-size)), linear-gradient(90deg, var(--grid-color) 0 1px, transparent 1px var(--beam-size))`,
            backgroundSize: `var(--beam-size) var(--beam-size)`,
            backgroundPosition: `50% -0.5px, 50% 50%`,
          }}
          className="@container absolute top-full h-[100cqmax] w-[100cqi] origin-[50%_0%] [transform:rotateX(-90deg)] [transform-style:preserve-3d] opacity-40 dark:opacity-50"
        >
          {bottomBeams.map((beam, index) => (
            <Beam
              key={`bottom-${index}`}
              index={index + 10}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>

        {/* Left wall */}
        <div
          style={{
            backgroundImage: `linear-gradient(var(--grid-color) 0 1px, transparent 1px var(--beam-size)), linear-gradient(90deg, var(--grid-color) 0 1px, transparent 1px var(--beam-size))`,
            backgroundSize: `var(--beam-size) var(--beam-size)`,
            backgroundPosition: `50% -0.5px, 50% 50%`,
          }}
          className="@container absolute top-0 left-0 h-[100cqmax] w-[100cqh] origin-[0%_0%] [transform:rotate(90deg)_rotateX(-90deg)] [transform-style:preserve-3d] opacity-40 dark:opacity-50"
        >
          {leftBeams.map((beam, index) => (
            <Beam
              key={`left-${index}`}
              index={index + 20}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>

        {/* Right wall */}
        <div
          style={{
            backgroundImage: `linear-gradient(var(--grid-color) 0 1px, transparent 1px var(--beam-size)), linear-gradient(90deg, var(--grid-color) 0 1px, transparent 1px var(--beam-size))`,
            backgroundSize: `var(--beam-size) var(--beam-size)`,
            backgroundPosition: `50% -0.5px, 50% 50%`,
          }}
          className="@container absolute top-0 right-0 h-[100cqmax] w-[100cqh] origin-[100%_0%] [transform:rotate(-90deg)_rotateX(-90deg)] [transform-style:preserve-3d] opacity-40 dark:opacity-50"
        >
          {rightBeams.map((beam, index) => (
            <Beam
              key={`right-${index}`}
              index={index + 30}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};
