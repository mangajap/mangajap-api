import MongooseJsonApi, { JsonApiInstanceMethods, JsonApiModel, JsonApiQueryHelper } from "@stantanasi/mongoose-jsonapi";
import { HydratedDocument, model, Model, Schema, Types } from "mongoose";
import { deleteFile, uploadFile } from "../firebase-app";
import MongooseSearch, { SearchInstanceMethods, SearchModel, SearchQueryHelper } from "../utils/mongoose-search/mongoose-search";
import { TStaff } from "./staff.model";

export interface IPeople {
  _id: Types.ObjectId;

  firstName: string;
  lastName: string;
  pseudo: string;
  image: string | null;

  staff?: TStaff[];
  "anime-staff"?: TStaff[];
  "manga-staff"?: TStaff[];

  createdAt: Date;
  updatedAt: Date;
}

export type PeopleInstanceMethods = JsonApiInstanceMethods & SearchInstanceMethods

export type PeopleQueryHelper = JsonApiQueryHelper & SearchQueryHelper

export type PeopleModel = Model<IPeople, PeopleQueryHelper, PeopleInstanceMethods> & JsonApiModel<IPeople> & SearchModel<IPeople>

export const PeopleSchema = new Schema<IPeople, PeopleModel, PeopleInstanceMethods, PeopleQueryHelper>({
  firstName: {
    type: String,
    default: "",
  },

  lastName: {
    type: String,
    default: "",
  },

  pseudo: {
    type: String,
    default: "",
  },

  image: {
    type: String,
    default: null,
  },
}, {
  id: false,
  versionKey: false,
  timestamps: true,
  minimize: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

PeopleSchema.virtual("staff", {
  ref: "Staff",
  localField: "_id",
  foreignField: "people",
});

PeopleSchema.virtual("anime-staff", {
  ref: "Staff",
  localField: "_id",
  foreignField: "people",
  match: {
    anime: { $exists: true, $ne: null },
  },
});

PeopleSchema.virtual("manga-staff", {
  ref: "Staff",
  localField: "_id",
  foreignField: "people",
  match: {
    manga: { $exists: true, $ne: null },
  },
});


PeopleSchema.pre<TPeople>("save", async function () {
  if (this.isModified("image")) {
    this.image = await uploadFile(
      `peoples/${this._id}/images/profile.jpg`,
      this.image,
    );
  }
});

PeopleSchema.pre<TPeople>("deleteOne", async function () {
  if (this.image) {
    await deleteFile(
      `peoples/${this._id}/images/profile.jpg`,
    );
  }
});


PeopleSchema.plugin(MongooseSearch, {
  fields: ["firstName", "lastName", "pseudo"],
});

PeopleSchema.plugin(MongooseJsonApi, {
  type: "peoples",
  filter: {
    query: (query: string) => {
      return {
        $search: query,
      };
    },
  },
});


export type TPeople = HydratedDocument<IPeople, PeopleInstanceMethods, PeopleQueryHelper>;

const People = model<IPeople, PeopleModel>("People", PeopleSchema);
export default People;
