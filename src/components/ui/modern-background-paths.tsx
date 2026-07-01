"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

/** Deterministic “random” in [0, 1) from integers (SSR-safe). */
function hash01(a: number, b: number) {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Stable floats for SVG attributes (avoids Node vs browser Math drift on hydration). */
function svgRound(n: number, decimals = 2) {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

function GeometricPaths() {
  const gridSize = 40;
  const paths = useMemo(() => {
    const out: { id: string; d: string; delay: number }[] = [];
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 12; y++) {
        if (hash01(x, y) > 0.7) {
          out.push({
            id: `grid-${x}-${y}`,
            d: `M${x * gridSize},${y * gridSize} L${(x + 1) * gridSize},${y * gridSize} L${(x + 1) * gridSize},${(y + 1) * gridSize} L${x * gridSize},${(y + 1) * gridSize} Z`,
            delay: hash01(x + 3, y + 5) * 5,
          });
        }
      }
    }
    return out;
  }, []);

  return (
    <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 480">
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.55, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            delay: path.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function FlowPaths() {
  const flowPaths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const amplitude = 50 + i * 10;
        const offset = i * 60;
        return {
          id: `flow-${i}`,
          d: `M-100,${200 + offset} Q200,${200 + offset - amplitude} 500,${200 + offset} T900,${200 + offset}`,
          strokeWidth: 1 + i * 0.3,
          opacity: 0.1 + i * 0.05,
          delay: i * 0.8,
        };
      }),
    []
  );

  return (
    <svg className="absolute inset-0 h-full w-full opacity-35" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 800">
      {flowPaths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={path.strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: [0, 1, 0.8, 0],
            opacity: [0, path.opacity, path.opacity * 0.7, 0],
          }}
          transition={{
            duration: 15,
            delay: path.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

const NODE_COUNT = 36;

function NeuralPaths() {
  const { nodes, connections } = useMemo(() => {
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: svgRound(hash01(i, 1) * 800),
      y: svgRound(hash01(i, 2) * 600),
      id: `node-${i}`,
    }));
    const connections: { id: string; d: string; delay: number }[] = [];
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i >= j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 130 && hash01(i, j) > 0.55) {
          connections.push({
            id: `conn-${i}-${j}`,
            d: `M${svgRound(node.x)},${svgRound(node.y)} L${svgRound(other.x)},${svgRound(other.y)}`,
            delay: svgRound(hash01(i + 7, j + 9) * 10, 3),
          });
        }
      });
    });
    return { nodes, connections };
  }, []);

  return (
    <svg className="absolute inset-0 h-full w-full opacity-25" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600">
      {connections.map((conn) => (
        <motion.path
          key={conn.id}
          d={conn.d}
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.75, 0],
          }}
          transition={{
            duration: 6,
            delay: conn.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {nodes.map((node, i) => (
        <motion.circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r="2"
          fill="currentColor"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 1.15, 1],
            opacity: [0, 0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 4,
            delay: svgRound(hash01(i, 4) * 2, 3),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function SpiralPaths() {
  const spirals = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const centerX = 400 + ((i % 4) - 1.5) * 200;
        const centerY = 300 + (Math.floor(i / 4) - 0.5) * 200;
        const radius = 80 + i * 15;
        const turns = 3 + i * 0.5;

        let path = `M${svgRound(centerX + radius)},${svgRound(centerY)}`;
        for (let angle = 0; angle <= turns * 360; angle += 5) {
          const radian = (angle * Math.PI) / 180;
          const currentRadius = radius * (1 - angle / (turns * 360));
          const x = centerX + currentRadius * Math.cos(radian);
          const y = centerY + currentRadius * Math.sin(radian);
          path += ` L${svgRound(x)},${svgRound(y)}`;
        }

        return {
          id: `spiral-${i}`,
          d: path,
          delay: i * 1.2,
        };
      }),
    []
  );

  return (
    <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600">
      {spirals.map((spiral) => (
        <motion.path
          key={spiral.id}
          d={spiral.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{
            duration: 12,
            delay: spiral.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

const PATTERN_KEYS = ["neural", "flow", "geometric", "spiral"] as const;

/**
 * Animated SVG path layers for the hero — sits above the video, pointer-events none.
 * Patterns rotate on an interval; all geometry is deterministic (no Math.random during render).
 */
export function HeroDecorativePaths() {
  const [currentPattern, setCurrentPattern] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPattern((prev) => (prev + 1) % PATTERN_KEYS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const renderPattern = () => {
    switch (currentPattern) {
      case 0:
        return <NeuralPaths />;
      case 1:
        return <FlowPaths />;
      case 2:
        return <GeometricPaths />;
      case 3:
        return <SpiralPaths />;
      default:
        return <NeuralPaths />;
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] text-white/50 dark:text-white/35">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPattern}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {renderPattern()}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute left-[12%] top-[22%] h-4 w-4 rounded-full bg-primary/25 blur-sm"
        animate={{
          y: [0, -16, 0],
          x: [0, 10, 0],
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.55, 0.25],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[28%] right-[18%] h-6 w-6 rounded-full bg-indigo-400/20 blur-sm"
        animate={{
          y: [0, 14, 0],
          x: [0, -12, 0],
          scale: [1, 0.9, 1],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

export default HeroDecorativePaths;
