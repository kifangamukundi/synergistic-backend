import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import moment from 'moment';
import Survey from '../models/surveyModel.js';
import User from '../models/userModel.js';
import { isAuth, isAdmin, isAdminOrModerator } from '../utils.js';

const surveyRouter = express.Router();

surveyRouter.get('/', async (req, res) => {
  const surveys = await Survey.find();
  res.send(surveys);
});

surveyRouter.post(
  '/',
  isAuth,
  isAdminOrModerator,
  expressAsyncHandler(async (req, res) => {
    const newSurvey = new Survey({
      name: 'Test survey ' + Date.now(),
      slug: 'survey-' + Date.now(),
      isActive: true,
      category: 'farmer',
      numResponses: 0,
      description: 'survey description',
      image: '/images/survey.jpg',
      surveyJson: {
        "title": "Test Title",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed aliquam sem orci, eu dictum ante mollis quis. Pellentesque id tortor ullamcorper, fermentum leo in, lacinia ante. Etiam condimentum, urna ut eleifend iaculis, mauris velit laoreet nunc, ornare efficitur ligula quam at sapien. Vestibulum laoreet, magna vehicula ultrices euismod, nunc sapien egestas purus, non faucibus ex sem eget dui. Phasellus euismod augue magna, ullamcorper tempus velit semper id.",
        "logoPosition": "right",
        "pages": [
         {
          "name": "page1",
          "elements": [
           {
            "type": "text",
            "name": "name",
            "title": "Please enter your name:",
            "isRequired": true,
            "autoComplete": "name",
            "placeholder": "Kifanga Mukundi"
           },
           {
            "type": "text",
            "name": "birthdate",
            "title": "Your birthdate:",
            "isRequired": true,
            "inputType": "date",
            "autoComplete": "bdate"
           },
           {
            "type": "text",
            "name": "color",
            "title": "Your favorite color:",
            "inputType": "color"
           },
           {
            "type": "text",
            "name": "email",
            "title": "Your e-mail:",
            "validators": [
             {
              "type": "email"
             }
            ],
            "inputType": "email",
            "autoComplete": "email",
            "placeholder": "chriskifanga@gmail.com"
           }
          ]
         }
        ]
       }
    });
    const survey = await newSurvey.save();
    res.send({ message: 'Survey Created', survey });
  })
);

surveyRouter.put(
  '/:id',
  isAuth,
  isAdminOrModerator,
  expressAsyncHandler(async (req, res) => {
    const surveyId = req.params.id;
    const survey = await Survey.findById(surveyId);
    if (survey) {
      survey.name = req.body.name;
      survey.slug = req.body.slug;
      survey.isActive = req.body.isActive;
      survey.category = req.body.category;
      survey.description = req.body.description;
      survey.image = req.body.image;
      survey.surveyJson = req.body.surveyJson;
      await survey.save();
      res.send({ message: 'Survey Updated' });
    } else {
      res.status(404).send({ message: 'Survey Not Found' });
    }
  })
);

surveyRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const survey = await Survey.findById(req.params.id);
    if (survey) {
      await survey.remove();
      res.send({ message: 'Survey Deleted' });
    } else {
      res.status(404).send({ message: 'Survey Not Found' });
    }
  })
);

surveyRouter.post(
  '/:id/responses',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const surveyId = req.params.id;
    const survey = await Survey.findById(surveyId);
    if (survey) {
      if (survey.responses.find((x) => x._id === req.user._id)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a response' });
      }

      const response = {
        user: req.user._id,
        response: req.body.response,
      };
      survey.responses.push(response);
      survey.numResponses = survey.responses.length;
      const updateSurvey = await survey.save();
      res.status(201).send({
        message: 'Response Created',
        response: updateSurvey.responses[updateSurvey.responses.length - 1],
        numResponses: survey.numResponses,
      });
    } else {
      res.status(404).send({ message: 'Survey Not Found' });
    }
  })
);

const PAGE_SIZE = 12;

surveyRouter.get(
  '/admin',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const surveys = await Survey.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countSurveys = await Survey.countDocuments();
    res.send({
      surveys,
      countSurveys,
      page,
      pages: Math.ceil(countSurveys / pageSize),
    });
  })
);

surveyRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const isActive = query.isActive || '';
    const numResponses = query.numResponses || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};
    const categoryFilter = category && category !== 'all' ? { category } : {};
    const isActiveFilter = isActive && isActive !== 'all' ? { isActive } : {};
    const numResponsesFilter =
      numResponses && numResponses !== 'all'
        ? {
            // 1-50
            numResponses: {
              $gte: Number(numResponses.split('-')[0]),
              $lte: Number(numResponses.split('-')[1]),
            },
          }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { numResponses: 1 }
        : order === 'highest'
        ? { numResponses: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };
    const surveys = await Survey.find({
      ...queryFilter,
      ...categoryFilter,
      ...isActiveFilter,
      ...numResponsesFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countSurveys = await Survey.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...isActiveFilter,
    });
    res.send({
      surveys,
      countSurveys,
      page,
      pages: Math.ceil(countSurveys / pageSize),
    });
  })
);

surveyRouter.get(
  '/summary',
  // isAuth,
  // isAdmin,
  expressAsyncHandler(async (req, res) => {

    const previousMonth = moment()
      .month(moment().month() - 1)
      .set("date", 1)
      .format("YYYY-MM-DD HH:mm:ss");
    
    const test = await User.aggregate([
      {
        $match: { createdAt: { $gte: new Date(previousMonth)}},
      },
      {
        $project: {
          month: { $month: "$createdAt"},
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1},
        },
      },
    ]);
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    const surveys = await Survey.aggregate([
      {
        $group: {
          _id: null,
          numSurveys: { $sum: 1 },
        },
      },
    ]);
    const surveyCategories = await Survey.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, surveys, surveyCategories, test });
  })
);

surveyRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Survey.find().distinct('category');
    res.send(categories);
  })
);

surveyRouter.get('/slug/:slug', async (req, res) => {
  const survey = await Survey.findOne({ slug: req.params.slug });
  if (survey) {
    res.send(survey);
  } else {
    res.status(404).send({ message: 'Survey Not Found' });
  }
});
surveyRouter.get('/:id', async (req, res) => {
  const survey = await Survey.findById(req.params.id);
  if (survey) {
    res.send(survey);
  } else {
    res.status(404).send({ message: 'Survey Not Found' });
  }
});

export default surveyRouter;
