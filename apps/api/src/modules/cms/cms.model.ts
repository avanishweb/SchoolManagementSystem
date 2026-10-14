import { Schema, model, Document, Model, Types } from 'mongoose';
import { ICmsPage, ICmsNotice } from '@smart-school/shared-types';

export interface CmsPageDocument extends Omit<ICmsPage, 'id' | '_id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const cmsPageSchema = new Schema<CmsPageDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    bannerImageUrl: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

cmsPageSchema.index({ schoolId: 1, slug: 1 }, { unique: true });
export const CmsPage: Model<CmsPageDocument> = model<CmsPageDocument>('CmsPage', cmsPageSchema);

// CMS Notice Model
export interface CmsNoticeDocument extends Omit<ICmsNotice, 'id' | '_id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const cmsNoticeSchema = new Schema<CmsNoticeDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'academic', 'sports', 'holiday'],
      default: 'general',
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    attachmentUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

cmsNoticeSchema.index({ schoolId: 1, isPublished: 1, date: -1 });
export const CmsNotice: Model<CmsNoticeDocument> = model<CmsNoticeDocument>('CmsNotice', cmsNoticeSchema);
