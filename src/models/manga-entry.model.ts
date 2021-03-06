import { Schema, model, Types } from 'mongoose';
import MongooseJsonApi, { JsonApiModel } from '../utils/mongoose-jsonapi/mongoose-jsonapi';
import { IManga } from "./manga.model";
import { IUser } from "./user.model";

export interface IMangaEntry {
  _id: Types.ObjectId;

  isAdd: boolean;
  isFavorites: boolean;
  status: 'reading' | 'completed' | 'planned' | 'on_hold' | 'dropped';
  volumesRead: number;
  chaptersRead: number;
  rating: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;

  user: string & IUser;
  manga: Types.ObjectId & IManga;

  createdAt: Date;
  updatedAt: Date;
}

export interface IMangaEntryModel extends JsonApiModel<IMangaEntry> {
}

export const MangaEntrySchema = new Schema<IMangaEntry, IMangaEntryModel>({
  isAdd: {
    type: Boolean,
    default: false
  },

  isFavorites: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    default: 'reading',
    enum: ['reading', 'completed', 'planned', 'on_hold', 'dropped']
  },

  volumesRead: {
    type: Number,
    default: 0
  },

  chaptersRead: {
    type: Number,
    default: 0
  },

  rating: {
    type: Number,
    default: null
  },

  startedAt: {
    type: Date,
    default: new Date()
  },

  finishedAt: {
    type: Date,
    default: null
  },


  user: {
    type: String,
    ref: 'User',
    required: true
  },

  manga: {
    type: Schema.Types.ObjectId,
    ref: 'Manga',
    required: true
  },
}, {
  id: false,
  versionKey: false,
  timestamps: true,
  minimize: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

MangaEntrySchema.index({
  user: 1,
  manga: 1
}, { unique: true });


MangaEntrySchema.plugin(MongooseJsonApi, {
  type: 'manga-entries',
});


const MangaEntry = model<IMangaEntry, IMangaEntryModel>('MangaEntry', MangaEntrySchema);
export default MangaEntry;
