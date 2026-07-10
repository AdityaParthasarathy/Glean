import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

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
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
console.log(`Seeded ${DATA_FILE}`);
console.log(
  `  ${retailers.length} retailers, ${ngos.length} NGOs, ${batches.length} batches`
);
