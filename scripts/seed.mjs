import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

// Mirrors src/lib/auth.ts's hashPassword — duplicated here since this is a
// plain Node script with no TS loader.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const retailers = [
  {
    id: id(),
    name: "Riverside Market",
    location: "Downtown Portland, OR",
    lat: 45.5152,
    lng: -122.6784,
    createdAt: now(),
  },
  {
    id: id(),
    name: "Elm Street Grocers",
    location: "Southeast Portland, OR",
    lat: 45.4995,
    lng: -122.6265,
    createdAt: now(),
  },
];

// Fictional NGOs for demo purposes only — see spec section 7. Not real
// organizations; do not imply an unconfirmed partnership.
const ngos = [
  {
    id: id(),
    name: "Community Food Shelter",
    location: "Old Town, Portland, OR",
    lat: 45.5245,
    lng: -122.6729,
    acceptedCategories: ["produce", "bakery", "dairy", "packaged"],
    minFreshness: 40,
    capacityPerDay: 80,
    createdAt: now(),
  },
  {
    id: id(),
    name: "Neighbors Table Pantry",
    location: "North Portland, OR",
    lat: 45.5589,
    lng: -122.7139,
    acceptedCategories: ["packaged", "frozen", "dairy"],
    minFreshness: 55,
    capacityPerDay: 50,
    createdAt: now(),
  },
  {
    id: id(),
    name: "Harbor Relief Kitchen",
    location: "Milwaukie, OR",
    lat: 45.4468,
    lng: -122.6395,
    acceptedCategories: ["produce", "prepared", "bakery"],
    minFreshness: 50,
    capacityPerDay: 40,
    createdAt: now(),
  },
];

const [riverside, elm] = retailers;
const [communityShelter, tablePantry, harborKitchen] = ngos;

// Demo credentials — printed to the console below. Each retailer/NGO
// account is scoped to exactly one retailerId/ngoId; admin is the Glean
// operator with access to the cross-cutting dispatch console only.
const CREDENTIALS = [
  { username: "glean-admin", password: "glean-admin-demo" },
  { username: "riverside", password: "riverside-demo" },
  { username: "elmstreet", password: "elmstreet-demo" },
  { username: "food-shelter", password: "shelter-demo" },
  { username: "table-pantry", password: "pantry-demo" },
  { username: "relief-kitchen", password: "kitchen-demo" },
];
const [adminCred, riversideCred, elmCred, shelterCred, pantryCred, kitchenCred] =
  CREDENTIALS;

const accounts = [
  {
    id: id(),
    username: adminCred.username,
    passwordHash: hashPassword(adminCred.password),
    role: "admin",
    retailerId: null,
    ngoId: null,
    displayName: "Glean Admin",
  },
  {
    id: id(),
    username: riversideCred.username,
    passwordHash: hashPassword(riversideCred.password),
    role: "retailer",
    retailerId: riverside.id,
    ngoId: null,
    displayName: riverside.name,
  },
  {
    id: id(),
    username: elmCred.username,
    passwordHash: hashPassword(elmCred.password),
    role: "retailer",
    retailerId: elm.id,
    ngoId: null,
    displayName: elm.name,
  },
  {
    id: id(),
    username: shelterCred.username,
    passwordHash: hashPassword(shelterCred.password),
    role: "ngo",
    retailerId: null,
    ngoId: communityShelter.id,
    displayName: communityShelter.name,
  },
  {
    id: id(),
    username: pantryCred.username,
    passwordHash: hashPassword(pantryCred.password),
    role: "ngo",
    retailerId: null,
    ngoId: tablePantry.id,
    displayName: tablePantry.name,
  },
  {
    id: id(),
    username: kitchenCred.username,
    passwordHash: hashPassword(kitchenCred.password),
    role: "ngo",
    retailerId: null,
    ngoId: harborKitchen.id,
    displayName: harborKitchen.name,
  },
];

const batches = [
  {
    id: id(),
    retailerId: riverside.id,
    category: "produce",
    itemName: "Organic Strawberries (flat)",
    quantity: 24,
    unit: "flats",
    unitPrice: 4.5,
    photoUrl: null,
    listedAt: daysAgo(2),
    expiryDate: null,
    freshnessScore: 0,
    isSafe: true,
    suggestedMarkdownPct: 0,
    status: "Listed",
  },
  {
    id: id(),
    retailerId: riverside.id,
    category: "bakery",
    itemName: "Sourdough Loaves",
    quantity: 15,
    unit: "loaves",
    unitPrice: 5.0,
    photoUrl: null,
    listedAt: daysAgo(1),
    expiryDate: null,
    freshnessScore: 0,
    isSafe: true,
    suggestedMarkdownPct: 0,
    status: "Listed",
  },
  {
    id: id(),
    retailerId: elm.id,
    category: "dairy",
    itemName: "Greek Yogurt Tubs",
    quantity: 30,
    unit: "tubs",
    unitPrice: 3.25,
    photoUrl: null,
    listedAt: daysAgo(4),
    expiryDate: daysFromNow(2),
    freshnessScore: 0,
    isSafe: true,
    suggestedMarkdownPct: 0,
    status: "Listed",
  },
  {
    id: id(),
    retailerId: elm.id,
    category: "packaged",
    itemName: "Granola Boxes",
    quantity: 40,
    unit: "boxes",
    unitPrice: 4.0,
    photoUrl: null,
    listedAt: daysAgo(10),
    expiryDate: daysFromNow(45),
    freshnessScore: 0,
    isSafe: true,
    suggestedMarkdownPct: 0,
    status: "Listed",
  },
  {
    id: id(),
    retailerId: riverside.id,
    category: "produce",
    itemName: "Mixed Salad Greens",
    quantity: 18,
    unit: "bags",
    unitPrice: 3.75,
    photoUrl: null,
    listedAt: daysAgo(5),
    expiryDate: null,
    freshnessScore: 0,
    isSafe: true,
    suggestedMarkdownPct: 0,
    status: "Listed",
  },
];

const db = {
  retailers,
  ngos,
  batches,
  matches: [],
  impactLogs: [],
  accounts,
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
console.log(`Seeded ${DATA_FILE}`);
console.log(
  `  ${retailers.length} retailers, ${ngos.length} NGOs, ${batches.length} batches, ${accounts.length} accounts`
);
console.log("\nDemo login credentials:");
for (const { username, password } of CREDENTIALS) {
  console.log(`  ${username} / ${password}`);
}
