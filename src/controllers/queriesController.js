import { Query } from '../models/Query.js'

export async function listQueries(_req, res) {
  const rows = await Query.find().sort({ _id: -1 }).lean()
  res.json(rows)
}

export async function getQuery(req, res) {
  const id = req.params.id
  const q = await Query.findById(id).lean()
  if (!q) return res.status(404).json({ error: 'Not found' })
  res.json(q)
}

export async function createQuery(req, res) {
  const { name, email, phone, message } = req.body
  if (!name || !email || !phone || !message) return res.status(400).json({ error: 'Missing fields' })
  const created = await Query.create({ name: String(name), email: String(email), phone: String(phone), message: String(message) })
  res.status(201).json({ id: created._id })
}