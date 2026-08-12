"use client";

import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { createCardboardTexture } from "@/lib/proceduralTextures";

// Non-interactive decorative stock — no click/hover, no name tag, not
// backed by a FoodBatch. A single retailer will realistically only ever
// have a handful of real listings, nowhere near enough to fill 3 aisles,
// so this exists purely to make the shelves read as actually stocked.

// Deterministic pseudo-random so the layout is stable across renders
// instead of reshuffling every time React re-renders the scene.
function seededRandom(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export interface FillerSlotSpec {
  x: number;
  z0: number;
  z1: number;
  y: number;
  /** z positions already occupied by real items on this tier — skipped. */
  excludeZ: number[];
  seed: number;
}

function buildSlots(z0: number, z1: number, spacing: number, excludeZ: number[]): number[] {
  const slots: number[] = [];
  for (let z = z1 - 0.5; z >= z0 + 0.5; z -= spacing) {
    if (excludeZ.some((ez) => Math.abs(ez - z) < spacing * 0.7)) continue;
    slots.push(z);
  }
  return slots;
}

const PRODUCE_COLORS = ["#7cb342", "#c0392b", "#e67e22", "#f1c40f", "#8e44ad"];
const DAIRY_COLORS = ["#f5f5f0", "#eef3e0", "#fdf6e3", "#e8d9c0", "#f0e6d6"];
// Tints applied over a neutral cardboard texture (see createCardboardTexture
// below) — real supermarket shelves are many different brands/colors, not
// one box repeated, so this is the single biggest lever for "stocked" vs
// "wallpapered".
const SHELF_TINTS = ["#c9a06a", "#8a9bc4", "#c4685a", "#7a9b6e", "#d9b877", "#a67c52"];

/** Produce bin filler — loose scattered piles, not a rigid grid. */
export function ProduceFiller({ x, z0, z1, y, excludeZ, seed }: FillerSlotSpec) {
  const excludeKey = excludeZ.join(",");
  const items = useMemo(() => {
    const rand = seededRandom(seed);
    return buildSlots(z0, z1, 0.4, excludeZ).map((z) => ({
      z: z + (rand() - 0.5) * 0.25,
      xJitter: (rand() - 0.5) * 0.35,
      yJitter: rand() * 0.12,
      scale: 0.7 + rand() * 0.45,
      color: PRODUCE_COLORS[Math.floor(rand() * PRODUCE_COLORS.length)],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- excludeKey stands in for excludeZ's content
  }, [z0, z1, seed, excludeKey]);

  if (items.length === 0) return null;

  return (
    <Instances limit={items.length} range={items.length} castShadow receiveShadow>
      <sphereGeometry args={[0.13, 8, 6]} />
      <meshStandardMaterial roughness={0.75} />
      {items.map((it, i) => (
        <Instance
          key={i}
          position={[x + it.xJitter, y + it.yJitter, it.z]}
          scale={it.scale}
          color={it.color}
        />
      ))}
    </Instances>
  );
}

/** Metal shelf filler — neat rows of boxes, tinted to a mix of "brands"
 * over the same corrugated texture instead of one flat repeated color. */
export function ShelfFiller({ x, z0, z1, y, excludeZ, seed }: FillerSlotSpec) {
  const excludeKey = excludeZ.join(",");
  // Neutral/light base so per-instance color tints render cleanly — the
  // texture supplies the corrugation detail, the instance color supplies
  // the variety.
  const cardboardTex = useMemo(() => createCardboardTexture("#e5ddc8"), []);
  const items = useMemo(() => {
    const rand = seededRandom(seed);
    return buildSlots(z0, z1, 0.4, excludeZ).map((z) => ({
      z,
      scaleX: 0.8 + rand() * 0.3,
      scaleY: 0.75 + rand() * 0.55,
      color: SHELF_TINTS[Math.floor(rand() * SHELF_TINTS.length)],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- excludeKey stands in for excludeZ's content
  }, [z0, z1, seed, excludeKey]);

  if (items.length === 0) return null;

  return (
    <Instances limit={items.length} range={items.length} castShadow receiveShadow>
      <boxGeometry args={[0.32, 0.28, 0.32]} />
      <meshStandardMaterial map={cardboardTex} roughness={0.85} />
      {items.map((it, i) => (
        <Instance
          key={i}
          position={[x, y + (it.scaleY - 1) * 0.14, it.z]}
          scale={[it.scaleX, it.scaleY, it.scaleX]}
          color={it.color}
        />
      ))}
    </Instances>
  );
}

/** Refrigerated case filler — neat rows of pale dairy-carton boxes. */
export function CaseFiller({ x, z0, z1, y, excludeZ, seed }: FillerSlotSpec) {
  const excludeKey = excludeZ.join(",");
  const items = useMemo(() => {
    const rand = seededRandom(seed);
    return buildSlots(z0, z1, 0.35, excludeZ).map((z) => ({
      z,
      scale: 0.85 + rand() * 0.3,
      color: DAIRY_COLORS[Math.floor(rand() * DAIRY_COLORS.length)],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- excludeKey stands in for excludeZ's content
  }, [z0, z1, seed, excludeKey]);

  if (items.length === 0) return null;

  return (
    <Instances limit={items.length} range={items.length} castShadow receiveShadow>
      <boxGeometry args={[0.22, 0.3, 0.22]} />
      <meshStandardMaterial roughness={0.45} />
      {items.map((it, i) => (
        <Instance key={i} position={[x, y, it.z]} scale={it.scale} color={it.color} />
      ))}
    </Instances>
  );
}
