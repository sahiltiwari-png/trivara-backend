import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000'||'https://trivaraa.netlify.app/';

// Storage directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for multiple images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// DB setup
const dbPath = path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT
  );
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    original_price INTEGER NOT NULL,
    discounted_price INTEGER NOT NULL,
    dimensions TEXT NOT NULL,
    additional_info TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS property_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Ensure admin user exists (no secrets stored)
const ensureAdmin = db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)');
ensureAdmin.run('admin', null);

app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadDir));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Properties list
app.get('/api/properties', (_req, res) => {
  const props = db.prepare('SELECT * FROM properties ORDER BY id DESC').all();
  const imgStmt = db.prepare('SELECT id, path FROM property_images WHERE property_id = ?');
  const data = props.map((p) => ({
    id: p.id,
    category: p.category,
    subcategory: p.subcategory,
    name: p.name,
    location: p.location,
    originalPrice: p.original_price,
    discountedPrice: p.discounted_price,
    dimensions: p.dimensions,
    additionalInfo: p.additional_info,
    createdAt: p.created_at,
    images: imgStmt.all(p.id).map((i) => ({ id: i.id, url: `/uploads/${path.basename(i.path)}` })),
  }));
  res.json(data);
});

// Property by id
app.get('/api/properties/:id', (req, res) => {
  const id = Number(req.params.id);
  const p = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const images = db.prepare('SELECT id, path FROM property_images WHERE property_id = ?').all(id);
  res.json({
    id: p.id,
    category: p.category,
    subcategory: p.subcategory,
    name: p.name,
    location: p.location,
    originalPrice: p.original_price,
    discountedPrice: p.discounted_price,
    dimensions: p.dimensions,
    additionalInfo: p.additional_info,
    createdAt: p.created_at,
    images: images.map((i) => ({ id: i.id, url: `/uploads/${path.basename(i.path)}` })),
  });
});

// Create property
app.post('/api/properties', upload.array('images', 10), (req, res) => {
  try {
    const {
      category,
      subcategory,
      name,
      location,
      originalPrice,
      discountedPrice,
      dimensions,
      additionalInfo,
    } = req.body;

    if (!category || !subcategory || !name || !location || !originalPrice || !discountedPrice || !dimensions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const createdAt = new Date().toISOString();
    const insert = db.prepare(`INSERT INTO properties 
      (category, subcategory, name, location, original_price, discounted_price, dimensions, additional_info, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const info = insert.run(
      String(category),
      String(subcategory),
      String(name),
      String(location),
      Number(originalPrice),
      Number(discountedPrice),
      String(dimensions),
      additionalInfo ? String(additionalInfo) : null,
      createdAt,
    );
    const propId = info.lastInsertRowid;

    if (Array.isArray(req.files)) {
      const imgInsert = db.prepare('INSERT INTO property_images (property_id, path) VALUES (?, ?)');
      for (const f of req.files) {
        imgInsert.run(propId, f.path);
      }
    }

    res.status(201).json({ id: Number(propId) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property (append images, optionally remove some)
app.put('/api/properties/:id', upload.array('images', 10), (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT id FROM properties WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const {
      category,
      subcategory,
      name,
      location,
      originalPrice,
      discountedPrice,
      dimensions,
      additionalInfo,
      removeImageIds,
    } = req.body;

    const update = db.prepare(`UPDATE properties SET 
      category = COALESCE(?, category),
      subcategory = COALESCE(?, subcategory),
      name = COALESCE(?, name),
      location = COALESCE(?, location),
      original_price = COALESCE(?, original_price),
      discounted_price = COALESCE(?, discounted_price),
      dimensions = COALESCE(?, dimensions),
      additional_info = COALESCE(?, additional_info)
      WHERE id = ?`);
    update.run(
      category ?? null,
      subcategory ?? null,
      name ?? null,
      location ?? null,
      originalPrice != null ? Number(originalPrice) : null,
      discountedPrice != null ? Number(discountedPrice) : null,
      dimensions ?? null,
      additionalInfo ?? null,
      id,
    );

    // Remove images if requested
    if (removeImageIds) {
      const ids = Array.isArray(removeImageIds)
        ? removeImageIds.map((x) => Number(x))
        : String(removeImageIds)
            .split(',')
            .filter(Boolean)
            .map((x) => Number(x));
      const getImg = db.prepare('SELECT id, path FROM property_images WHERE id = ? AND property_id = ?');
      const delImg = db.prepare('DELETE FROM property_images WHERE id = ?');
      for (const imgId of ids) {
        const rec = getImg.get(imgId, id);
        if (rec) {
          try { fs.unlinkSync(rec.path); } catch {}
          delImg.run(imgId);
        }
      }
    }

    // Append new images
    if (Array.isArray(req.files)) {
      const imgInsert = db.prepare('INSERT INTO property_images (property_id, path) VALUES (?, ?)');
      for (const f of req.files) imgInsert.run(id, f.path);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
app.delete('/api/properties/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const imgs = db.prepare('SELECT path FROM property_images WHERE property_id = ?').all(id);
    const delProp = db.prepare('DELETE FROM properties WHERE id = ?');
    delProp.run(id);
    for (const i of imgs) { try { fs.unlinkSync(i.path); } catch {} }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Queries
app.get('/api/queries', (_req, res) => {
  const rows = db.prepare('SELECT * FROM queries ORDER BY id DESC').all();
  res.json(rows.map((q) => ({
    id: q.id,
    name: q.name,
    email: q.email,
    phone: q.phone,
    message: q.message,
    createdAt: q.created_at,
  })));
});

app.get('/api/queries/:id', (req, res) => {
  const id = Number(req.params.id);
  const q = db.prepare('SELECT * FROM queries WHERE id = ?').get(id);
  if (!q) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: q.id,
    name: q.name,
    email: q.email,
    phone: q.phone,
    message: q.message,
    createdAt: q.created_at,
  });
});

app.post('/api/queries', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !phone || !message) return res.status(400).json({ error: 'Missing fields' });
  const createdAt = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO queries (name, email, phone, message, created_at) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(String(name), String(email), String(phone), String(message), createdAt);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Uploads served from /uploads`);
});