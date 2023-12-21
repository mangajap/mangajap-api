import express from "express";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import Review from "../models/review.model";
import { IUser } from "../models/user.model";
import { isLogin } from "../utils/middlewares/middlewares";
import { JsonApiError } from "../utils/mongoose-jsonapi/mongoose-jsonapi";

const reviewRoutes = express.Router();

reviewRoutes.get('/', async (req, res, next) => {
  try {
    const response = await Review.find()
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      })
      .paginate({
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        query: req.query,
      });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

reviewRoutes.post('/', isLogin(), async (req, res, next) => {
  try {
    const id = await Review.fromJsonApi(req.body)
      .save()
      .then((doc) => doc._id);

    const response = await Review.findById(id)
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

reviewRoutes.get('/:id', async (req, res, next) => {
  try {
    const response = await Review.findById(req.params.id)
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

reviewRoutes.patch('/:id', isLogin(), async (req, res, next) => {
  try {
    await Review.findById(req.params.id)
      .orFail()
      .then((doc) => {
        const token: DecodedIdToken | null = res.locals.token;
        const user: IUser | null = res.locals.user;
        if (user && (token?.isAdmin || doc.user === user._id)) {
          return doc
            .merge(Review.fromJsonApi(req.body))
            .save();
        } else {
          throw new JsonApiError.PermissionDenied();
        }
      });

    const response = await Review.findById(req.params.id)
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

reviewRoutes.delete('/:id', isLogin(), async (req, res, next) => {
  try {
    await Review.findById(req.params.id)
      .orFail()
      .then((doc) => {
        const token: DecodedIdToken | null = res.locals.token;
        const user: IUser | null = res.locals.user;
        if (user && (token?.isAdmin || doc.user === user._id)) {
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


reviewRoutes.get('/:id/user', async (req, res, next) => {
  try {
    const response = await Review.findById(req.params.id)
      .getRelationship('user')
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

reviewRoutes.get('/:id/manga', async (req, res, next) => {
  try {
    const response = await Review.findById(req.params.id)
      .getRelationship('manga')
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

reviewRoutes.get('/:id/anime', async (req, res, next) => {
  try {
    const response = await Review.findById(req.params.id)
      .getRelationship('anime')
      .withJsonApi(req.query)
      .toJsonApi({
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });

    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default reviewRoutes
