"use client";

import { useMemo, type ComponentType } from "react";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import WalkController, { type Obstacle } from "./WalkController";
import { MetalShelfRack, ProduceBin, RefrigeratedCase, FIXTURE_HALF_DEPTH } from "./Fixtures";
import { ProduceFiller, ShelfFiller, CaseFiller, type FillerSlotSpec } from "./AisleFiller";
import Crate from "./Crate";
import { createTileFloorTexture } from "@/lib/proceduralTextures";
import type { FoodBatch, FoodCategory } from "@/lib/types";

// Three aisles, grouped by real-world adjacency rather than the raw
// FoodCategory list — produce sits next to bakery, dairy next to frozen,
// packaged/prepared share standard shelving.
const AISLE_X = [-6, 0, 6];
const AISLE_SIDE_OFFSET = 1.7;
const AISLE_Z0 = -6.5;
const AISLE_Z1 = 6.5;
const ITEM_SPACING = 1.3;

const CATEGORY_AISLE: Record<FoodCategory, number> = {
  produce: 0,
  bakery: 0,
  packaged: 1,
  prepared: 1,
  dairy: 2,
  frozen: 2,
};

// Item resting height per aisle — sitting on the produce bin's lip, the
// shelf rack's middle board, and the refrigerated case's base cabinet,
// respectively (see Fixtures.tsx for the matching fixture geometry).
const ITEM_Y = [0.95, 1.33, 0.9];

const STORE_MIN_X = -9.5;
const STORE_MAX_X = 9.5;
const STORE_MIN_Z = -9;
const STORE_MAX_Z = 9.5;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.3;
const CEILING_Y = 3;
const ENTRANCE_HALF_WIDTH = 2;

const WALL_COLOR = "#f3ede0";

function groupByAisle(batches: FoodBatch[]): FoodBatch[][] {
  const groups: FoodBatch[][] = [[], [], []];
  for (const b of batches) {
    groups[CATEGORY_AISLE[b.category]].push(b);
  }
  return groups;
}

function itemPosition(aisleIndex: number, indexInAisle: number): [number, number, number] {
  const laneX = AISLE_X[aisleIndex];
  const side = indexInAisle % 2 === 0 ? -1 : 1;
  const slot = Math.floor(indexInAisle / 2);
  const x = laneX + side * (AISLE_SIDE_OFFSET - 0.15);
  const z = AISLE_Z1 - 0.6 - slot * ITEM_SPACING;
  return [x, ITEM_Y[aisleIndex], Math.max(AISLE_Z0 + 0.4, z)];
}

/** Real (batch-backed) item z positions for one aisle, split by side, so
 * decorative filler on that same shelf tier knows which slots to skip. */
function realZPositionsBySide(aisleIndex: number, group: FoodBatch[]) {
  const left: number[] = [];
  const right: number[] = [];
  group.forEach((_, i) => {
    const [, , z] = itemPosition(aisleIndex, i);
    (i % 2 === 0 ? left : right).push(z);
  });
  return { left, right };
}

// Extra shelf tiers filled purely with decorative stock — real items only
// ever occupy one tier per aisle (ITEM_Y above); a single retailer will
// never have enough real listings to fill 3 aisles on its own, so these
// exist to make the shelves read as actually stocked.
const SHELF_FILLER_TIERS = [0.575, ITEM_Y[1], 1.975]; // bottom, middle (real), top
const CASE_FILLER_TIERS = [ITEM_Y[2], 1.5]; // lower (real), upper

interface FillerConfig extends FillerSlotSpec {
  Comp: ComponentType<FillerSlotSpec>;
}

function buildFillerConfigs(aisleGroups: FoodBatch[][]): FillerConfig[] {
  const configs: FillerConfig[] = [];
  let seed = 1;

  const real0 = realZPositionsBySide(0, aisleGroups[0]);
  for (const side of [-1, 1] as const) {
    configs.push({
      Comp: ProduceFiller,
      x: AISLE_X[0] + side * AISLE_SIDE_OFFSET,
      z0: AISLE_Z0,
      z1: AISLE_Z1,
      y: ITEM_Y[0],
      excludeZ: side === -1 ? real0.left : real0.right,
      seed: seed++,
    });
  }

  const real1 = realZPositionsBySide(1, aisleGroups[1]);
  SHELF_FILLER_TIERS.forEach((y, tier) => {
    for (const side of [-1, 1] as const) {
      const isRealTier = tier === 1;
      configs.push({
        Comp: ShelfFiller,
        x: AISLE_X[1] + side * AISLE_SIDE_OFFSET,
        z0: AISLE_Z0,
        z1: AISLE_Z1,
        y,
        excludeZ: isRealTier ? (side === -1 ? real1.left : real1.right) : [],
        seed: seed++,
      });
    }
  });

  const real2 = realZPositionsBySide(2, aisleGroups[2]);
  CASE_FILLER_TIERS.forEach((y, tier) => {
    for (const side of [-1, 1] as const) {
      const isRealTier = tier === 0;
      configs.push({
        Comp: CaseFiller,
        x: AISLE_X[2] + side * AISLE_SIDE_OFFSET,
        z0: AISLE_Z0,
        z1: AISLE_Z1,
        y,
        excludeZ: isRealTier ? (side === -1 ? real2.left : real2.right) : [],
        seed: seed++,
      });
    }
  });

  return configs;
}

function StoreShell() {
  const floorTex = useMemo(() => createTileFloorTexture(), []);
  const width = STORE_MAX_X - STORE_MIN_X;
  const depth = STORE_MAX_Z - STORE_MIN_Z;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={floorTex} roughness={0.8} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEILING_Y, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f8f3e6" roughness={0.95} />
      </mesh>

      {/* back wall */}
      <mesh position={[0, WALL_HEIGHT / 2, STORE_MIN_Z]} receiveShadow>
        <boxGeometry args={[width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>
      {/* left wall */}
      <mesh
        position={[STORE_MIN_X, WALL_HEIGHT / 2, (STORE_MIN_Z + STORE_MAX_Z) / 2]}
        receiveShadow
      >
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, depth]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>
      {/* right wall */}
      <mesh
        position={[STORE_MAX_X, WALL_HEIGHT / 2, (STORE_MIN_Z + STORE_MAX_Z) / 2]}
        receiveShadow
      >
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, depth]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>
      {/* front wall, split around the entrance gap */}
      <mesh
        position={[
          (STORE_MIN_X + -ENTRANCE_HALF_WIDTH) / 2,
          WALL_HEIGHT / 2,
          STORE_MAX_Z,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[-ENTRANCE_HALF_WIDTH - STORE_MIN_X, WALL_HEIGHT, WALL_THICKNESS]}
        />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>
      <mesh
        position={[(ENTRANCE_HALF_WIDTH + STORE_MAX_X) / 2, WALL_HEIGHT / 2, STORE_MAX_Z]}
        receiveShadow
      >
        <boxGeometry
          args={[STORE_MAX_X - ENTRANCE_HALF_WIDTH, WALL_HEIGHT, WALL_THICKNESS]}
        />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>
    </>
  );
}

function CeilingLights() {
  const positions: [number, number, number][] = AISLE_X.flatMap((x) => [
    [x, CEILING_Y, -3] as [number, number, number],
    [x, CEILING_Y, 3] as [number, number, number],
  ]);

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.3, 0.05, 2.5]} />
            <meshBasicMaterial color="#fffdf5" toneMapped={false} />
          </mesh>
          <pointLight position={[0, -0.4, 0]} intensity={11} distance={10} decay={2} color="#fff3df" />
        </group>
      ))}
    </>
  );
}

function CheckoutCounter({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 0.6]} />
        <meshStandardMaterial color="#f0ece0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[1.7, 0.05, 0.7]} />
        <meshStandardMaterial color="#3d4a33" roughness={0.5} />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={10}>
        <div className="pointer-events-none whitespace-nowrap rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-700 shadow">
          CHECKOUT
        </div>
      </Html>
    </group>
  );
}

const AISLE_LABELS = ["PRODUCE & BAKERY", "PANTRY", "DAIRY & FROZEN"];

const CHECKOUT_POSITIONS: [number, number][] = [
  [-8, 8],
  [8, 8],
];

export default function WarehouseScene({
  batches,
  selectedId,
  onSelect,
}: {
  batches: FoodBatch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const aisleGroups = groupByAisle(batches);
  // Cheap to rebuild each render (a few array/object literals) — the
  // expensive seeded-random generation lives inside each filler
  // component's own useMemo, keyed on primitive props, so it doesn't
  // recompute unless its own tier's content actually changed.
  const fillerConfigs = buildFillerConfigs(aisleGroups);

  const obstacles: Obstacle[] = useMemo(() => {
    const list: Obstacle[] = [];
    for (const x of AISLE_X) {
      for (const side of [-1, 1]) {
        const fx = x + side * AISLE_SIDE_OFFSET;
        list.push({
          minX: fx - FIXTURE_HALF_DEPTH,
          maxX: fx + FIXTURE_HALF_DEPTH,
          minZ: AISLE_Z0,
          maxZ: AISLE_Z1,
        });
      }
    }
    for (const [cx, cz] of CHECKOUT_POSITIONS) {
      list.push({ minX: cx - 0.85, maxX: cx + 0.85, minZ: cz - 0.35, maxZ: cz + 0.35 });
    }
    return list;
    // AISLE_X/CHECKOUT_POSITIONS are module-level constants — this only
    // ever needs to run once.
  }, []);

  return (
    <Canvas
      shadows
      camera={{ fov: 65, near: 0.1, far: 60 }}
      onPointerMissed={() => onSelect("")}
    >
      <color attach="background" args={["#f3ede0"]} />
      <ambientLight intensity={0.55} color="#fff3df" />
      <directionalLight
        position={[3, CEILING_Y - 0.2, 5]}
        intensity={0.5}
        color="#fff6e6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />

      <StoreShell />
      <CeilingLights />

      {/* Positioned just ahead of the spawn point (start z below) so it's
          the first thing visible, not behind the player. */}
      <Html position={[0, 2.0, 7]} center distanceFactor={10}>
        <div className="pointer-events-none whitespace-nowrap rounded-md bg-white/90 px-3 py-1 font-serif text-base font-semibold text-[#445337] shadow">
          Glean Market
        </div>
      </Html>

      {AISLE_X.map((x, i) => (
        <Html key={x} position={[x, 2.0, AISLE_Z1 + 0.3]} center distanceFactor={10}>
          <div className="pointer-events-none whitespace-nowrap rounded-md bg-white/90 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-zinc-700 shadow">
            {AISLE_LABELS[i]}
          </div>
        </Html>
      ))}

      {CHECKOUT_POSITIONS.map(([x, z]) => (
        <CheckoutCounter key={`${x}-${z}`} x={x} z={z} />
      ))}

      {AISLE_X.map((x) => (
        <group key={x}>
          {x === AISLE_X[0] && (
            <>
              <ProduceBin x={x - AISLE_SIDE_OFFSET} z0={AISLE_Z0} z1={AISLE_Z1} />
              <ProduceBin x={x + AISLE_SIDE_OFFSET} z0={AISLE_Z0} z1={AISLE_Z1} />
            </>
          )}
          {x === AISLE_X[1] && (
            <>
              <MetalShelfRack x={x - AISLE_SIDE_OFFSET} z0={AISLE_Z0} z1={AISLE_Z1} />
              <MetalShelfRack x={x + AISLE_SIDE_OFFSET} z0={AISLE_Z0} z1={AISLE_Z1} />
            </>
          )}
          {x === AISLE_X[2] && (
            <>
              <RefrigeratedCase x={x - AISLE_SIDE_OFFSET} z0={AISLE_Z0} z1={AISLE_Z1} />
              <RefrigeratedCase x={x + AISLE_SIDE_OFFSET} z0={AISLE_Z0} z1={AISLE_Z1} />
            </>
          )}
        </group>
      ))}

      {fillerConfigs.map((cfg, i) => (
        <cfg.Comp
          key={i}
          x={cfg.x}
          z0={cfg.z0}
          z1={cfg.z1}
          y={cfg.y}
          excludeZ={cfg.excludeZ}
          seed={cfg.seed}
        />
      ))}

      {aisleGroups.map((group, aisleIndex) =>
        group.map((batch, i) => (
          <Crate
            key={batch.id}
            batch={batch}
            position={itemPosition(aisleIndex, i)}
            selected={batch.id === selectedId}
            onSelect={onSelect}
          />
        ))
      )}

      <WalkController
        bounds={{
          minX: STORE_MIN_X + 0.4,
          maxX: STORE_MAX_X - 0.4,
          minZ: STORE_MIN_Z + 0.4,
          maxZ: STORE_MAX_Z - 0.4,
        }}
        obstacles={obstacles}
        start={{ x: 0, z: STORE_MAX_Z - 1.5, yaw: 0 }}
      />
    </Canvas>
  );
}
