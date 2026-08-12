"use client";

import { useMemo, useState } from "react";
import { Html, Edges } from "@react-three/drei";
import type { FoodBatch } from "@/lib/types";
import { freshnessTone, type FreshnessTone, CATEGORY_COLOR } from "@/lib/format";
import { createCardboardTexture } from "@/lib/proceduralTextures";

// Matches Glean's own --color-status-* tokens (globals.css) so the 3D
// scene's freshness signal reads the same as the 2D dashboards. The
// previous version keyed this map by "emerald"/"amber"/"orange"/"red",
// which never matched freshnessTone()'s actual "fresh"/"mid"/"low"/"unsafe"
// return values — every crate silently rendered with the material default
// (white) regardless of freshness. Fixed here.
const TONE_HEX: Record<FreshnessTone, string> = {
  fresh: "#445337",
  mid: "#94721f",
  low: "#a85c34",
  unsafe: "#8a3a30",
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
  const tone = freshnessTone(batch.freshnessScore, batch.isSafe);
  const tagColor = TONE_HEX[tone];
  const boxColor = CATEGORY_COLOR[batch.category];

  // Packaged goods get an actual cardboard texture; everything else is a
  // plain matte category color (produce/dairy/etc. don't come in boxes).
  const cardboardTex = useMemo(
    () => (batch.category === "packaged" ? createCardboardTexture(boxColor) : null),
    [batch.category, boxColor]
  );

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
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        {cardboardTex ? (
          <meshStandardMaterial map={cardboardTex} roughness={0.85} />
        ) : (
          <meshStandardMaterial color={boxColor} roughness={0.8} />
        )}
        {(hovered || selected) && <Edges color="#ffffff" lineWidth={selected ? 3 : 2} />}
      </mesh>

      {/* Freshness/clearance tag on the box front — a small sticker, not a
          full glow, closer to how a real shelf marks reduced-to-clear. */}
      <mesh position={[0, -0.12, 0.26]}>
        <boxGeometry args={[0.3, 0.12, 0.02]} />
        <meshStandardMaterial color={tagColor} roughness={0.6} />
      </mesh>

      <Html position={[0, 0.4, 0]} center distanceFactor={8} occlude>
        <div className="pointer-events-none whitespace-nowrap rounded-full border border-black/10 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-zinc-800 shadow-sm">
          {batch.itemName}
        </div>
      </Html>
    </group>
  );
}
