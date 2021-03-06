import { Schema, model, Types } from 'mongoose';
import MongooseJsonApi, { JsonApiModel } from '../utils/mongoose-jsonapi/mongoose-jsonapi';
import Anime, { IAnime } from "./anime.model";
import Manga, { IManga } from "./manga.model";

export interface IFranchise {
  _id: Types.ObjectId;

  role: 'adaptation' | 'alternative_setting' | 'alternative_version' | 'character' | 'full_story' | 'other' | 'parent_story' | 'prequel' | 'sequel' | 'side_story' | 'spinoff' | 'summary';

  source: Types.ObjectId & (IAnime | IManga);
  destination: Types.ObjectId & (IAnime | IManga);

  sourceModel: 'Anime' | 'Manga';
  destinationModel: 'Anime' | 'Manga';

  createdAt: Date;
  updatedAt: Date;
}

export interface IFranchiseModel extends JsonApiModel<IFranchise> {
}

export const FranchiseSchema = new Schema<IFranchise, IFranchiseModel>({
  role: {
    type: String,
    required: true,
    enum: ['adaptation', 'alternative_setting', 'alternative_version', 'character', 'full_story', 'other', 'parent_story', 'prequel', 'sequel', 'side_story', 'spinoff', 'summary']
  },


  source: {
    type: Schema.Types.ObjectId,
    refPath: 'sourceModel',
    required: true
  },

  destination: {
    type: Schema.Types.ObjectId,
    refPath: 'destinationModel',
    required: true
  },


  sourceModel: {
    type: String,
    required: true,
    enum: ['Anime', 'Manga']
  },

  destinationModel: {
    type: String,
    required: true,
    enum: ['Anime', 'Manga']
  },
}, {
  id: false,
  versionKey: false,
  timestamps: true,
  minimize: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


FranchiseSchema.pre<IFranchise & Document>('validate', async function () {
  if (!this.sourceModel && this.source) {
    if (await Anime.exists({ _id: this.source }))
      this.sourceModel = 'Anime';
    else if (await Manga.exists({ _id: this.source }))
      this.sourceModel = 'Manga';
  }

  if (!this.destinationModel && this.destination) {
    if (await Anime.exists({ _id: this.destination }))
      this.destinationModel = 'Anime';
    else if (await Manga.exists({ _id: this.destination }))
      this.destinationModel = 'Manga';
  }
});


FranchiseSchema.plugin(MongooseJsonApi, {
  type: 'franchises',
});


const Franchise = model<IFranchise, IFranchiseModel>('Franchise', FranchiseSchema);
export default Franchise;
