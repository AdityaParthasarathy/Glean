"use client";

import { useState } from "react";
import { Html, Edges } from "@react-three/drei";
import type { FoodBatch } from "@/lib/types";
import { freshnessTone } from "@/lib/format";

const TONE_HEX: Record<string, string> = {
  emerald: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
};

export default function Crate({
  batch,
  position,
  onSelect,
  selected,
}: {
  batch: FoodBatch;
  position: [number, number, number];
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const color = TONE_HEX[freshnessTone(batch.freshnessScore, batch.isSafe)];

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(batch.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        scale={hovered || selected ? 1.08 : 1}
      >
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.1 : hovered ? 0.8 : 0.5}
          transparent
          opacity={0.4}
        />
        <Edges color={color} lineWidth={selected ? 3 : 1.5} />
      </mesh>
      <Html position={[0, 0.75, 0]} center distanceFactor={8} occlude>
        <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {batch.itemName}
        </div>
      </Html>
    </group>
  );
}
