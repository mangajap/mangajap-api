import { model, Schema, Types } from 'mongoose';
import JsonApiSerializer from "../utils/mongoose-jsonapi/jsonapi-serializer";
import { IAnime } from "./anime.model";
import { ISeason } from "./season.model";

export interface IEpisode {
  _id: Types.ObjectId;

  titles: {
    [language: string]: string;
  };
  relativeNumber: number;
  number: number;
  airDate: Date | null;
  episodeType: '' | 'oav';

  anime: Types.ObjectId & IAnime;
  season: Types.ObjectId & ISeason;

  createdAt: Date;
  updatedAt: Date;
}

export const EpisodeSchema = new Schema<IEpisode>({
  titles: {
    type: Schema.Types.Mixed,
    default: {},
  },
  
  relativeNumber: {
    type: Number,
    required: true
  },
  
  number: {
    type: Number,
    required: true
  },
  
  airDate: {
    type: Date,
    default: null
  },
  
  episodeType: {
    type: String,
    default: '',
    enum: ['', 'oav']
  },

  
  anime: {
    type: Schema.Types.ObjectId,
    ref: 'Anime',
    required: true
  },
  
  season: {
    type: Schema.Types.ObjectId,
    ref: 'Season',
    required: true
  },
}, {
  id: false,
  versionKey: false,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


const Episode = model<IEpisode>('Episode', EpisodeSchema);
export default Episode;


JsonApiSerializer.register('episodes', Episode);
