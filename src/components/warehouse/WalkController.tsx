"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const EYE_HEIGHT = 1.6;
const WALK_SPEED = 5; // units/sec
const LOOK_SPEED = 2.2; // rad/sec
const TWO_PI = Math.PI * 2;
const PLAYER_RADIUS = 0.35;

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Obstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WalkControllerProps {
  bounds: Bounds;
  obstacles: Obstacle[];
  start: { x: number; z: number; yaw: number };
}

const KEY_ALIASES: Record<string, string> = {
  arrowup: "w",
  arrowdown: "s",
  arrowleft: "a",
  arrowright: "d",
};

function circleIntersectsRect(x: number, z: number, r: number, rect: Obstacle): boolean {
  const closestX = Math.max(rect.minX, Math.min(x, rect.maxX));
  const closestZ = Math.max(rect.minZ, Math.min(z, rect.maxZ));
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < r * r;
}

function isBlocked(x: number, z: number, obstacles: Obstacle[]): boolean {
  return obstacles.some((o) => circleIntersectsRect(x, z, PLAYER_RADIUS, o));
}

/**
 * Keyboard-only first-person controller: W/S (or arrows) walk in the
 * direction the camera is currently facing, A/D (or left/right) turn in
 * place. Deliberately not pointer-lock/mouse-drag — keyboard events are
 * reliably scriptable for automated verification, same reasoning as before.
 *
 * Movement is real 2D (x, z) now, not a single clamped axis — the player
 * treats fixtures as circle-vs-AABB obstacles and slides along whichever
 * axis isn't blocked instead of just stopping dead at a wall or shelf.
 */
export default function WalkController({ bounds, obstacles, start }: WalkControllerProps) {
  const { camera } = useThree();
  const xRef = useRef(start.x);
  const zRef = useRef(start.z);
  const yawRef = useRef(start.yaw);
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

    if (k.has("a")) yawRef.current += LOOK_SPEED * delta;
    if (k.has("d")) yawRef.current -= LOOK_SPEED * delta;
    yawRef.current = ((yawRef.current % TWO_PI) + TWO_PI) % TWO_PI;

    let moveDir = 0;
    if (k.has("w")) moveDir += 1;
    if (k.has("s")) moveDir -= 1;

    if (moveDir !== 0) {
      // Camera forward (local -Z rotated by yaw) is (-sin(yaw), -cos(yaw)).
      const dx = -Math.sin(yawRef.current) * moveDir * WALK_SPEED * delta;
      const dz = -Math.cos(yawRef.current) * moveDir * WALK_SPEED * delta;

      const clampX = (x: number) =>
        Math.min(bounds.maxX - PLAYER_RADIUS, Math.max(bounds.minX + PLAYER_RADIUS, x));
      const clampZ = (z: number) =>
        Math.min(bounds.maxZ - PLAYER_RADIUS, Math.max(bounds.minZ + PLAYER_RADIUS, z));

      const fullX = clampX(xRef.current + dx);
      const fullZ = clampZ(zRef.current + dz);

      if (!isBlocked(fullX, fullZ, obstacles)) {
        xRef.current = fullX;
        zRef.current = fullZ;
      } else if (!isBlocked(fullX, zRef.current, obstacles)) {
        // Slide along X — the Z move alone was what hit something.
        xRef.current = fullX;
      } else if (!isBlocked(xRef.current, fullZ, obstacles)) {
        // Slide along Z — the X move alone was what hit something.
        zRef.current = fullZ;
      }
      // Otherwise both axes are blocked — hold position.
    }

    camera.position.set(xRef.current, EYE_HEIGHT, zRef.current);
    camera.rotation.set(0, yawRef.current, 0);
  });

  return null;
}
