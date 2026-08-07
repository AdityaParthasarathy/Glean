"use client";

import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import WalkController from "./WalkController";
import Crate from "./Crate";
import type { FoodBatch } from "@/lib/types";

const SPACING = 3;
const Z_START = 6;
const SHELF_X = 2.1;
const RACK_X = 2.7;
const SHELF_Y = 1.1;
const AISLE_BOUNDS = { minZ: -6, maxZ: 9 };

function itemPosition(index: number): [number, number, number] {
  const side = index % 2 === 0 ? -1 : 1;
  const slot = Math.floor(index / 2);
  return [side * SHELF_X, SHELF_Y, Z_START - slot * SPACING];
}

function ShelfRack({ x }: { x: number }) {
  return (
    <group position={[x, 0, 1]}>
      {/* uprights */}
      <mesh position={[0, 1, 8]}>
        <boxGeometry args={[0.15, 2.2, 0.15]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 1, -7]}>
        <boxGeometry args={[0.15, 2.2, 0.15]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* shelf boards */}
      {[0.6, 1.6].map((y) => (
        <mesh key={y} position={[0, y, 0.5]}>
          <boxGeometry args={[0.7, 0.06, 16]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
    </group>
  );
}

export default function WarehouseScene({
  batches,
  selectedId,
  onSelect,
}: {
  batches: FoodBatch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Canvas
      camera={{ fov: 70, near: 0.1, far: 60 }}
      onPointerMissed={() => onSelect("")}
    >
      <color attach="background" args={["#070b12"]} />
      <fog attach="fog" args={["#070b12", 14, 30]} />
      {/* Flat stylized fill so the aisle reads clearly regardless of
          distance — decay={0} skips physically-correct falloff, which at
          normal intensities left everything past a couple meters pitch
          black. */}
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#67e8f9", "#0f172a", 1.4]} />
      <pointLight position={[0, 3.5, 6]} intensity={12} decay={0} color="#22d3ee" />
      <pointLight position={[0, 3.5, -1]} intensity={10} decay={0} color="#a855f7" />
      <pointLight position={[0, 3.5, -7]} intensity={10} decay={0} color="#22d3ee" />

      <Grid
        position={[0, 0, 0]}
        args={[30, 30]}
        cellColor="#164e63"
        sectionColor="#0891b2"
        fadeDistance={22}
        infiniteGrid
      />

      <ShelfRack x={-RACK_X} />
      <ShelfRack x={RACK_X} />

      {batches.map((batch, i) => (
        <Crate
          key={batch.id}
          batch={batch}
          position={itemPosition(i)}
          selected={batch.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      <WalkController minZ={AISLE_BOUNDS.minZ} maxZ={AISLE_BOUNDS.maxZ} />
    </Canvas>
  );
}
