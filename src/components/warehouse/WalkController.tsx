"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const EYE_HEIGHT = 1.6;
const WALK_SPEED = 6; // units/sec
const LOOK_SPEED = 2.2; // rad/sec
const TWO_PI = Math.PI * 2;

export interface AisleBounds {
  minZ: number;
  maxZ: number;
}

const KEY_ALIASES: Record<string, string> = {
  arrowup: "w",
  arrowdown: "s",
  arrowleft: "a",
  arrowright: "d",
};

/**
 * Minimal keyboard-only first-person controller: W/S (or arrows) walk along
 * the aisle's z-axis, A/D (or left/right) do a free 360° turn. Deliberately
 * not pointer-lock/mouse-drag based — keyboard events are reliably
 * scriptable for automated verification, and this is a walking aisle, not
 * a flight sim, so no vertical look/pitch is needed yet.
 */
export default function WalkController({ minZ, maxZ }: AisleBounds) {
  const { camera } = useThree();
  const zRef = useRef((minZ + maxZ) / 2 + (maxZ - minZ) / 2 - 1);
  const yawRef = useRef(0);
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const normalize = (key: string) => KEY_ALIASES[key.toLowerCase()] ?? key.toLowerCase();
    const onDown = (e: KeyboardEvent) => keys.current.add(normalize(e.key));
    const onUp = (e: KeyboardEvent) => keys.current.delete(normalize(e.key));
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useFrame((_, delta) => {
    const k = keys.current;
    if (k.has("w")) zRef.current -= WALK_SPEED * delta;
    if (k.has("s")) zRef.current += WALK_SPEED * delta;
    zRef.current = Math.min(maxZ, Math.max(minZ, zRef.current));

    if (k.has("a")) yawRef.current += LOOK_SPEED * delta;
    if (k.has("d")) yawRef.current -= LOOK_SPEED * delta;
    // Free 360° look — normalize so it doesn't drift over a long session.
    yawRef.current = ((yawRef.current % TWO_PI) + TWO_PI) % TWO_PI;

    camera.position.set(0, EYE_HEIGHT, zRef.current);
    camera.rotation.set(0, yawRef.current, 0);
  });

  return null;
}
