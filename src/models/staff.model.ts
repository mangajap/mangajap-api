import { HydratedDocument, model, Model, Schema, Types } from "mongoose";
import MongooseJsonApi, { JsonApiInstanceMethods, JsonApiModel, JsonApiQueryHelper } from "../utils/mongoose-jsonapi/mongoose-jsonapi";
import { TAnime } from "./anime.model";
import { TManga } from "./manga.model";
import { TPeople } from "./people.model";

enum StaffRole {
  Author = "author", 
  Illustrator = "illustrator", 
  StoryAndArt = "story_and_art", 
  Licensor = "licensor", 
  Producer = "producer", 
  Studio = "studio", 
  OriginalCreator = "original_creator",
}

export interface IStaff {
  _id: Types.ObjectId;

  role: StaffRole;

  people: Types.ObjectId | TPeople;
  anime?: Types.ObjectId | TAnime;
  manga?: Types.ObjectId | TManga;

  createdAt: Date;
  updatedAt: Date;
}

export interface StaffInstanceMethods extends JsonApiInstanceMethods { }

export interface StaffQueryHelper extends JsonApiQueryHelper { }

export interface StaffModel extends Model<IStaff, StaffQueryHelper, StaffInstanceMethods> { }

export const StaffSchema = new Schema<IStaff, StaffModel & JsonApiModel<IStaff>, StaffInstanceMethods, StaffQueryHelper>({
  role: {
    type: String,
    required: true,
    enum: Object.values(StaffRole),
  },


  people: {
    type: Schema.Types.ObjectId,
    ref: "People",
    required: true,
  },

  anime: {
    type: Schema.Types.ObjectId,
    ref: "Anime",
    default: undefined,
  },

  manga: {
    type: Schema.Types.ObjectId,
    ref: "Manga",
    default: undefined,
  },
}, {
  id: false,
  versionKey: false,
  timestamps: true,
  minimize: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


StaffSchema.plugin(MongooseJsonApi, {
  type: "staff",
});


export type TStaff = HydratedDocument<IStaff, StaffInstanceMethods, StaffQueryHelper>;

const Staff = model<IStaff, StaffModel & JsonApiModel<IStaff>>("Staff", StaffSchema);
export default Staff;
