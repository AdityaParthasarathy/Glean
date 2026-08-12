"use client";

import { useMemo } from "react";
import {
  createMetalTexture,
  createWoodTexture,
} from "@/lib/proceduralTextures";

// Every fixture is one continuous run spanning [z0, z1] on a given aisle
// side (x) — simpler and more realistic-looking than segmenting into many
// short racks, and it gives WarehouseScene one clean rectangle per fixture
// to use as a collision obstacle.
export interface FixtureRunProps {
  x: number;
  z0: number;
  z1: number;
}

// Half-depth (x-axis) every fixture occupies — shared with the collision
// obstacle list built in WarehouseScene so visuals and collision agree.
export const FIXTURE_HALF_DEPTH = 0.4;

export function MetalShelfRack({ x, z0, z1 }: FixtureRunProps) {
  const metalTex = useMemo(() => createMetalTexture(), []);
  const length = Math.abs(z1 - z0);
  const midZ = (z0 + z1) / 2;

  return (
    <group position={[x, 0, midZ]}>
      {[-(length / 2 - 0.12), length / 2 - 0.12].map((zOff) => (
        <mesh key={zOff} position={[0, 1.1, zOff]} castShadow receiveShadow>
          <boxGeometry args={[0.12, 2.2, 0.12]} />
          <meshStandardMaterial map={metalTex} roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      {[0.4, 1.1, 1.8].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.05, length - 0.2]} />
          <meshStandardMaterial map={metalTex} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function ProduceBin({ x, z0, z1 }: FixtureRunProps) {
  const woodTex = useMemo(() => createWoodTexture(), []);
  const length = Math.abs(z1 - z0);
  const midZ = (z0 + z1) / 2;

  return (
    <group position={[x, 0, midZ]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.8, length - 0.2]} />
        <meshStandardMaterial map={woodTex} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.06, length - 0.15]} />
        <meshStandardMaterial map={woodTex} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function RefrigeratedCase({ x, z0, z1 }: FixtureRunProps) {
  const length = Math.abs(z1 - z0);
  const midZ = (z0 + z1) / 2;

  return (
    <group position={[x, 0, midZ]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.7, length - 0.2]} />
        <meshStandardMaterial color="#f4f6f8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.65, 1.2, length - 0.25]} />
        <meshPhysicalMaterial
          color="#bfe7f5"
          transparent
          opacity={0.25}
          roughness={0.05}
          transmission={0.6}
          metalness={0}
        />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[0.5, 0.04, length - 0.4]} />
        <meshBasicMaterial color="#bff2ff" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} intensity={4} distance={4} decay={2} color="#a7e8f7" />
    </group>
  );
}
