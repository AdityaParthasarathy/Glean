import fs from "fs";
import path from "path";
import type { DB } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const EMPTY_DB: DB = {
  retailers: [],
  ngos: [],
  batches: [],
  matches: [],
  impactLogs: [],
  accounts: [],
};

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
  }
}

export function readDB(): DB {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as DB;
}

export function writeDB(db: DB) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Single-process dev/demo store — mutate under a function so callers never
// read-modify-write against a stale copy.
export function updateDB<T>(fn: (db: DB) => T): T {
  const db = readDB();
  const result = fn(db);
  writeDB(db);
  return result;
}
