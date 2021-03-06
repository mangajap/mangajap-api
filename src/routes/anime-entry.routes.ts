import express from "express";
import AnimeEntry from "../models/anime-entry.model";
import { IUser } from "../models/user.model";
import { isLogin } from "../utils/middlewares/middlewares";
import { JsonApiError } from "../utils/mongoose-jsonapi/mongoose-jsonapi";

const animeEntryRoutes = express.Router();

animeEntryRoutes.get('/', async (req, res, next) => {
  try {
    const body = await AnimeEntry.find()
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      })
      .paginate({
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        query: req.query,
      });

    res.json(body);
  } catch (err) {
    next(err);
  }
});

animeEntryRoutes.post('/', isLogin(), async (req, res, next) => {
  try {
    const id = await AnimeEntry.fromJsonApi(req.body)
      .save()
      .then((doc) => doc._id);

    const body = await AnimeEntry.findById(id)
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(body);
  } catch (err) {
    next(err);
  }
});

animeEntryRoutes.get('/:id', async (req, res, next) => {
  try {
    const body = await AnimeEntry.findById(req.params.id)
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(body);
  } catch (err) {
    next(err);
  }
});

animeEntryRoutes.patch('/:id', async (req, res, next) => {
  try {
    await AnimeEntry.findById(req.params.id)
      .orFail()
      .then((doc) => {
        const user: IUser | null = res.locals.user;
        if (user && (user.isAdmin || doc.user === user._id)) {
          return doc
            .merge(AnimeEntry.fromJsonApi(req.body))
            .save();
        } else {
          throw new JsonApiError.PermissionDenied();
        }
      });

    const body = await AnimeEntry.findById(req.params.id)
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(body);
  } catch (err) {
    next(err);
  }
});

animeEntryRoutes.delete('/:id', async (req, res, next) => {
  try {
    await AnimeEntry.findById(req.params.id)
      .orFail()
      .then((doc) => {
        const user: IUser | null = res.locals.user;
        if (user && (user.isAdmin || doc.user === user._id)) {
          return doc
            .delete();
        } else {
          throw new JsonApiError.PermissionDenied();
        }
      });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});


animeEntryRoutes.get('/:id/anime', async (req, res, next) => {
  try {
    const body = await AnimeEntry.findById(req.params.id)
      .getRelationship('anime')
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(body);
  } catch (err) {
    next(err);
  }
});

animeEntryRoutes.get('/:id/user', async (req, res, next) => {
  try {
    const body = await AnimeEntry.findById(req.params.id)
      .getRelationship('user')
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default animeEntryRoutes
