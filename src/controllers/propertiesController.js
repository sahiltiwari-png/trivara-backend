import path from 'path'
import fs from 'fs'
import { uploadDir } from '../db.js'
import { Property } from '../models/Property.js'

export async function listProperties(_req, res) {
  const props = await Property.find().sort({ _id: -1 }).lean()
  res.json(props)
}

export async function getProperty(req, res) {
  const id = req.params.id
  const p = await Property.findById(id).lean()
  if (!p) return res.status(404).json({ error: 'Not found' })
  res.json(p)
}

export async function createProperty(req, res) {
  try {
    const { category, subcategory, name, location, originalPrice, discountedPrice, dimensions, additionalInfo } = req.body
    if (!category || !subcategory || !name || !location || !originalPrice || !discountedPrice || !dimensions) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    let images = []
    if (Array.isArray(req.files)) {
      images = req.files.map((f) => ({ url: `/uploads/${path.basename(f.path)}` }))
    } else if (req.body.images) {
      const b = req.body.images
      if (Array.isArray(b)) {
        images = b.map((x) => {
          if (typeof x === 'string') return { url: String(x).trim().replace(/^`|`$/g, '') }
          if (x && typeof x.url === 'string') return { url: String(x.url).trim().replace(/^`|`$/g, '') }
          return null
        }).filter(Boolean)
      }
    }
    const created = await Property.create({
      category: String(category),
      subcategory: String(subcategory),
      name: String(name),
      location: String(location),
      originalPrice: Number(originalPrice),
      discountedPrice: Number(discountedPrice),
      dimensions: String(dimensions),
      additionalInfo: additionalInfo ? String(additionalInfo) : undefined,
      images,
    })
    res.status(201).json({ id: created._id })
  } catch (e) {
    res.status(500).json({ error: 'Failed to create property' })
  }
}

export async function updateProperty(req, res) {
  try {
    const id = req.params.id
    const p = await Property.findById(id)
    if (!p) return res.status(404).json({ error: 'Not found' })
    const { category, subcategory, name, location, originalPrice, discountedPrice, dimensions, additionalInfo, removeImageIds } = req.body
    if (category != null) p.category = String(category)
    if (subcategory != null) p.subcategory = String(subcategory)
    if (name != null) p.name = String(name)
    if (location != null) p.location = String(location)
    if (originalPrice != null) p.originalPrice = Number(originalPrice)
    if (discountedPrice != null) p.discountedPrice = Number(discountedPrice)
    if (dimensions != null) p.dimensions = String(dimensions)
    if (additionalInfo != null) p.additionalInfo = String(additionalInfo)
    if (req.body.images) {
      const b = req.body.images
      if (Array.isArray(b)) {
        const mapped = b.map((x) => {
          if (typeof x === 'string') return { url: String(x).trim().replace(/^`|`$/g, '') }
          if (x && typeof x.url === 'string') return { url: String(x.url).trim().replace(/^`|`$/g, '') }
          return null
        }).filter(Boolean)
        p.images = mapped
      }
    }
    if (removeImageIds) {
      const ids = Array.isArray(removeImageIds)
        ? removeImageIds.map((x) => String(x))
        : String(removeImageIds).split(',').filter(Boolean).map((x) => String(x))
      const keep = []
      for (const img of p.images) {
        if (ids.includes(String(img._id))) {
          const filePath = path.join(uploadDir, path.basename(img.url))
          try { fs.unlinkSync(filePath) } catch {}
        } else {
          keep.push(img)
        }
      }
      p.images = keep
    }
    if (Array.isArray(req.files)) {
      for (const f of req.files) {
        p.images.push({ url: `/uploads/${path.basename(f.path)}` })
      }
    }
    await p.save()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update property' })
  }
}

export async function deleteProperty(req, res) {
  try {
    const id = req.params.id
    const p = await Property.findById(id)
    if (p && Array.isArray(p.images)) {
      for (const i of p.images) {
        const filePath = path.join(uploadDir, path.basename(i.url))
        try { fs.unlinkSync(filePath) } catch {}
      }
    }
    await Property.deleteOne({ _id: id })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete property' })
  }
}