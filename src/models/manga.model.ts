import { Schema, model, Types, Document } from 'mongoose';
import { ref } from 'firebase/storage';
import slugify from "slugify";
import { storage, uploadFile } from '../firebase-app';
import MongooseJsonApi, { JsonApiModel } from '../utils/mongoose-jsonapi/mongoose-jsonapi';
import MongooseSearch, { SearchModel } from '../utils/mongoose-search/mongoose-search';
import { IFranchise } from "./franchise.model";
import { IGenre } from "./genre.model";
import MangaEntry, { IMangaEntry } from "./manga-entry.model";
import Review, { IReview } from "./review.model";
import { IStaff } from "./staff.model";
import { ITheme } from "./theme.model";
import Volume, { IVolume } from "./volume.model";
import Chapter, { IChapter } from './chapter.model';

export interface IManga {
  _id: Types.ObjectId;

  title: string;
  titles: {
    [language: string]: string
  };
  slug: string;
  synopsis: string;
  startDate: Date;
  endDate: Date | null;
  origin: string;
  mangaType: 'bd' | 'comics' | 'josei' | 'kodomo' | 'seijin' | 'seinen' | 'shojo' | 'shonen' | 'doujin' | 'novel' | 'oneshot' | 'webtoon';
  status: 'publishing' | 'finished' | 'unreleased' | 'upcoming';
  coverImage: string | null;
  bannerImage: string | null;
  links: {
    [site: string]: string;
  };

  volumeCount: number;
  chapterCount: number;

  averageRating: number | null;
  ratingRank: number | null;
  popularity: number;
  userCount: number;
  favoritesCount: number;
  reviewCount: number;

  genres: Types.ObjectId[] & IGenre[];
  themes: Types.ObjectId[] & ITheme[];
  volumes?: IVolume[];
  chapters?: IChapter[];
  staff?: IStaff[];
  reviews?: IReview[];
  franchises?: IFranchise[];
  'manga-entry'?: IMangaEntry | null;

  createdAt: Date;
  updatedAt: Date;
}

export const MangaSchema = new Schema<IManga, JsonApiModel<IManga> & SearchModel<IManga>>({
  title: {
    type: String,
    required: true,
  },

  titles: {
    type: Schema.Types.Mixed,
    default: {},
  },

  slug: {
    type: String,
    required: true,
    lowercase: true,
  },

  synopsis: {
    type: String,
    default: '',
  },

  startDate: {
    type: Date,
    required: true,
    transform: function (this, val) {
      return val.toISOString().slice(0, 10);
    }
  },

  endDate: {
    type: Date,
    default: null,
    transform: function (this, val) {
      return val?.toISOString().slice(0, 10) ?? null;
    },
  },

  origin: {
    type: String,
    default: '',
  },

  mangaType: {
    type: String,
    required: true,
    enum: ['bd', 'comics', 'josei', 'kodomo', 'seijin', 'seinen', 'shojo', 'shonen', 'doujin', 'novel', 'oneshot', 'webtoon'],
  },

  status: {
    type: String,
    required: true,
    enum: ['publishing', 'finished', 'unreleased', 'upcoming'],
  },

  coverImage: {
    type: String,
    default: null,
  },

  bannerImage: {
    type: String,
    default: null,
  },

  links: {
    type: Schema.Types.Mixed,
    default: {},
  },


  volumeCount: {
    type: Number,
    default: 0
  },

  chapterCount: {
    type: Number,
    default: 0
  },


  averageRating: {
    type: Number,
    default: null
  },

  ratingRank: {
    type: Number,
    default: null
  },

  popularity: {
    type: Number,
    default: 0
  },

  userCount: {
    type: Number,
    default: 0
  },

  favoritesCount: {
    type: Number,
    default: 0
  },

  reviewCount: {
    type: Number,
    default: 0
  },


  genres: [{
    type: Schema.Types.ObjectId,
    ref: 'Genre',
    default: [],
  }],

  themes: [{
    type: Schema.Types.ObjectId,
    ref: 'Theme',
    default: [],
  }],
}, {
  id: false,
  versionKey: false,
  timestamps: true,
  minimize: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

MangaSchema.virtual('volumes', {
  ref: 'Volume',
  localField: '_id',
  foreignField: 'manga',
  options: {
    sort: { number: 1 },
  },
});

MangaSchema.virtual('chapters', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'manga',
  options: {
    sort: { number: 1 },
  },
});

MangaSchema.virtual('staff', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'manga'
});

MangaSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'manga',
  options: {
    sort: { updatedAt: -1 },
  },
});

MangaSchema.virtual('franchises', {
  ref: 'Franchise',
  localField: '_id',
  foreignField: 'source'
});

MangaSchema.virtual('manga-entry');


MangaSchema.pre<IManga & Document>('validate', async function () {
  if (this.isModified('title')) {
    this.slug = slugify(this.title);
  }
});

MangaSchema.pre<IManga & Document>('save', async function () {
  if (this.isModified('coverImage')) {
    this.coverImage = await uploadFile(
      ref(storage, `manga/${this._id}/images/cover.jpg`),
      this.coverImage,
    );
  }

  if (this.isModified('bannerImage')) {
    this.bannerImage = await uploadFile(
      ref(storage, `manga/${this._id}/images/banner.jpg`),
      this.bannerImage,
    );
  }
});

MangaSchema.pre('findOne', async function () {
  const _id = this.getFilter()._id;
  if (!_id) return;

  await Manga.findOneAndUpdate(this.getFilter(), {
    volumeCount: await Volume.count({
      manga: _id,
    }),

    chapterCount: await Chapter.count({
      manga: _id,
    }),

    averageRating: (await MangaEntry.aggregate()
      .match({ manga: new Types.ObjectId(_id) })
      .group({
        _id: null,
        averageRating: { $avg: '$rating' },
      }))[0]
      ?.averageRating ?? null,

    userCount: await MangaEntry.count({
      manga: _id,
      isAdd: true,
    }),

    favoritesCount: await MangaEntry.count({
      manga: _id,
      isFavorites: true,
    }),

    reviewCount: await Review.count({
      manga: _id,
    }),

    popularity: (await Manga.aggregate()
      .match({ _id: new Types.ObjectId(_id) })
      .lookup({
        from: 'mangaentries',
        localField: '_id',
        foreignField: 'manga',
        as: 'entriesCount',
        pipeline: [
          {
            $match: {
              updatedAt: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
              },
            },
          },
        ],
      })
      .addFields({ entriesCount: { $size: '$entriesCount' } })
      .addFields({
        popularity: {
          $add: [
            '$userCount', '$favoritesCount',
            { $multiply: ['$userCount', { $ifNull: ['$averageRating', 0] }] },
            { $multiply: [2, '$entriesCount', { $ifNull: ['$averageRating', 0] }, { $add: ['$userCount', '$favoritesCount'] }] }
          ],
        },
      }))[0]
      ?.popularity | 0 ?? 0,
  });
});


MangaSchema.plugin(MongooseSearch, {
  fields: ['title', 'titles'],
});

MangaSchema.plugin(MongooseJsonApi, {
  type: 'manga',
  filter: {
    query: (query: string) => {
      return {
        $search: query,
      };
    }
  },
});


const Manga = model<IManga, JsonApiModel<IManga> & SearchModel<IManga>>('Manga', MangaSchema);
export default Manga;


// TODO: cronjobs
// $mangas = Manga::getInstance()->getWriteConnection()->query("
//     SELECT
//         *
//     FROM
//         manga;");
// foreach ($mangas as &$manga) {
//     $rating = $manga['manga_rating'];
//     $userCount = $manga['manga_usercount'];
//     $favoritesCount = $manga['manga_favoritescount'];
//     $manga['manga_weightedrank'] = ($userCount + $favoritesCount) + $rating * $userCount + 2 * $rating * $favoritesCount;
// }
// array_multisort(array_column($mangas, 'manga_weightedrank'), SORT_DESC, $mangas);
// for($i=0; $i<count($mangas); $i++) {
//     $mangaId = $mangas[$i]["manga_id"];
//     $mangaRank = $i + 1;

//     Manga::getInstance()->getWriteConnection()->execute("
//         UPDATE
//             manga
//         SET
//             manga_ratingrank = :mangaRank
//         WHERE
//           manga_id = :mangaId;",
//         [
//             'mangaId' => $mangaId,
//             'mangaRank' => $mangaRank
//         ]);
// }
