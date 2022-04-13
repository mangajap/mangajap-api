import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import JsonApi from './utils/json-api/json-api';
import JsonApiError, { NotFoundError } from './utils/json-api/json-api.error';
import { AnimeSchema } from './models/anime.model';
import { MangaSchema } from './models/manga.model';
import User from './models/user.model';
import JsonApiSerializer from './utils/mongoose-jsonapi/jsonapi-serializer';
import JsonApiQueryParser from './utils/mongoose-jsonapi/jsonapi-query-parser';
import animeEntryRoutes from './routes/anime-entry.routes';
import animeRoutes from './routes/anime.routes';
import episodeRoutes from './routes/episode.routes';
import followRoutes from './routes/follow.routes';
import franchiseRoutes from './routes/franchise.routes';
import genreRoutes from './routes/genre.routes';
import mangaEntryRoutes from './routes/manga-entry.routes';
import mangaRoutes from './routes/manga.routes';
import peopleRoutes from './routes/people.routes';
import requestRoutes from './routes/request.routes';
import reviewRoutes from './routes/review.routes';
import seasonRoutes from './routes/season.routes';
import staffRoutes from './routes/staff.routes';
import themeRoutes from './routes/theme.routes';
import userRoutes from './routes/user.routes';
import volumeRoutes from './routes/volume.routes';
import chapterRoutes from './routes/chapter.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.get('/favicon.ico', (_req, res) => res.status(204).send());

app.use((req, res, next) => {
  if (req.method === 'POST') {
    if (req.body?.REQUEST_METHOD) {
      req.method = req.body.REQUEST_METHOD;
      req.body = req.body.data;
    }
  }
  next();
});

app.use((req, res, next) => {
  JsonApiSerializer.initialize({
    baseUrl: `${req.protocol}://${req.get('host')}`,
  });
  JsonApiQueryParser.initialize({
    defaultPagination: {
      limit: 10,
      offset: 0,
    },
  });
  next();
});

app.use(async (req, res, next) => {
  try {
    await connect(process.env.MONGO_DB_URI!)
    next();
  } catch (err) {
    next(err);
  }
});

app.use(async (req, res, next) => {
  try {
    // TODO: use firebase token instead
    let bearerToken = req.headers.authorization;
    if (bearerToken?.startsWith('Bearer ')) {
      bearerToken = bearerToken.substring(7);
    }

    const user = await User.findById(bearerToken);
    if (user) {
      AnimeSchema.virtual('anime-entry', {
        ref: 'AnimeEntry',
        localField: '_id',
        foreignField: 'anime',
        justOne: true,
        match: {
          user: user._id,
        },
      });

      MangaSchema.virtual('manga-entry', {
        ref: 'MangaEntry',
        localField: '_id',
        foreignField: 'manga',
        justOne: true,
        match: {
          user: user._id,
        },
      });
    }

    res.locals.user = user;

    next();
  } catch (err) {
    next(err);
  }
});

// TODO: DEPRECATED
app.use('/people', peopleRoutes);

app.use('/anime', animeRoutes);
app.use('/anime-entries', animeEntryRoutes);
app.use('/chapters', chapterRoutes);
app.use('/episodes', episodeRoutes);
app.use('/follows', followRoutes);
app.use('/franchises', franchiseRoutes);
app.use('/genres', genreRoutes);
app.use('/manga', mangaRoutes);
app.use('/manga-entries', mangaEntryRoutes);
app.use('/peoples', peopleRoutes);
app.use('/requests', requestRoutes);
app.use('/reviews', reviewRoutes);
app.use('/seasons', seasonRoutes);
app.use('/staff', staffRoutes);
app.use('/themes', themeRoutes);
app.use('/users', userRoutes);
app.use('/volumes', volumeRoutes);

app.all('*', (req, res) => {
  throw new NotFoundError(req.path);
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  if (err instanceof JsonApiError) {
    res.status(+(err.data.status || 500)).json(JsonApi.encodeError(err));
  } else {
    res.status(500).json(JsonApi.encodeError(err));
  }
});

const port = +(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
