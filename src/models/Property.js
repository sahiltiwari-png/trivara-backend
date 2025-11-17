import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
}, { timestamps: false })

const propertySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    dimensions: { type: String, required: true },
    additionalInfo: { type: String },
    images: { type: [imageSchema], default: [] },
  },
  { timestamps: true }
)

export const Property = mongoose.models.Property || mongoose.model('Property', propertySchema)