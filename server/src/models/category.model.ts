import mongoose, { Schema } from 'mongoose';
import { ICategory } from '../types/category.types';

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    ancestors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CategorySchema.index({ name: 1, parent: 1 }, { unique: true });
CategorySchema.index({ parent: 1, isActive: 1 });
CategorySchema.index({ ancestors: 1, isActive: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
