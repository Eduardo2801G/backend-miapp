// api/_db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;     // set en Vercel
const DB_NAME = process.env.MONGODB_DB || "miapp";

let client;
let db;

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri, { maxPoolSize: 5 });
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db;
}

// Helper CORS simple
export function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
