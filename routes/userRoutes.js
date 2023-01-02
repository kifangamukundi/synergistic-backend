import express from 'express';
import bcrypt from 'bcryptjs';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import { isAuth, isAdmin, isAdminOrModerator, generateToken } from '../utils.js';
import { signInRules, signUpRules, validate } from '../validators/userValidators.js';

const userRouter = express.Router();

userRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

const PAGE_SIZE = 4;

userRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const isActive = query.isActive || '';
    const isAdmin = query.isAdmin || '';
    const isModerator = query.isModerator || '';
    const isFieldAgent = query.isFieldAgent || '';
    const isFarmer = query.isFarmer || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
          $or: [
            { firstName: { $regex: searchQuery, $options: "i" } },
            { lastName: { $regex: searchQuery, $options: "i" } },
          ],
        }
        : {};
    const isActiveFilter = isActive && isActive !== 'all' ? { isActive } : {};
    const isAdminFilter = isAdmin && isAdmin !== 'all' ? { isAdmin } : {};
    const isModeratorFilter = isModerator && isModerator !== 'all' ? { isModerator } : {};
    const isFieldAgentFilter = isFieldAgent && isFieldAgent !== 'all' ? { isFieldAgent } : {};
    const isFarmerFilter = isFarmer && isFarmer !== 'all' ? { isFarmer } : {};
    const users = await User.find({
      ...queryFilter,
      ...isActiveFilter,
      ...isAdminFilter,
      ...isModeratorFilter,
      ...isFieldAgentFilter,
      ...isFarmerFilter,
    })
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countUsers = await User.countDocuments({
      ...queryFilter,
      ...isActiveFilter,
      ...isAdminFilter,
      ...isModeratorFilter,
      ...isFieldAgentFilter,
      ...isFarmerFilter,
    });
    res.send({
      users,
      countUsers,
      page,
      pages: Math.ceil(countUsers / pageSize),
    });
  })
);

userRouter.put(
  '/profile',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.mobileNumber = req.body.mobileNumber || user.mobileNumber;
      user.email = req.body.email || user.email;
      user.image = req.body.image || user.image;
      user.images = req.body.images || user.images;
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }

      const updatedUser = await user.save();
      res.send({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        mobileNumber: updatedUser.mobileNumber,
        email: updatedUser.email,
        image: updatedUser.image,
        images: updatedUser.images,
        isActive: updatedUser.isActive,
        isAdmin: updatedUser.isAdmin,
        isModerator: updatedUser.isModerator,
        isFieldAgent: updatedUser.isFieldAgent,
        isFarmer: updatedUser.isFarmer,
        token: generateToken(updatedUser),
      });
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  })
);

userRouter.post(
  '/signin',
  signInRules(),
  validate,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          email: user.email,
          image: user.image,
          images: user.images,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          isModerator: user.isModerator,
          isFieldAgent: user.isFieldAgent,
          isFarmer: user.isFarmer,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: ['Invalid password'] });
  })
);

userRouter.post(
  '/signup',
  signUpRules(),
  validate,
  expressAsyncHandler(async (req, res) => {
      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        mobileNumber: req.body.mobileNumber,
        email: req.body.email,
        image: '/images/avator.jpg',
        password: bcrypt.hashSync(req.body.password),
      });
      const user = await newUser.save();
      res.send({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        email: user.email,
        image: user.image,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        isModerator: user.isModerator,
        isFieldAgent: user.isFieldAgent,
        isFarmer: user.isFarmer,
        token: generateToken(user),
      });
    
  })
);

userRouter.get(
  '/:id',
  isAuth,
  isAdminOrModerator,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.put(
  '/:id',
  isAuth,
  isAdminOrModerator,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.mobileNumber = req.body.mobileNumber || user.mobileNumber;
      user.email = req.body.email || user.email;
      user.image = req.body.image || user.image;
      user.images = req.body.images || user.images;
      user.isActive = Boolean(req.body.isActive);
      user.isAdmin = Boolean(req.body.isAdmin);
      user.isModerator = Boolean(req.body.isModerator);
      user.isFieldAgent = Boolean(req.body.isFieldAgent);
      user.isFarmer = Boolean(req.body.isFarmer);
      
      const updatedUser = await user.save();
      res.send({ message: 'User Updated', user: updatedUser });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === 'mukundikifanga@gmail.com') {
        res.status(400).send({ message: 'Can Not Delete SuperAdmin User' });
        return;
      }
      await user.remove();
      res.send({ message: 'User Deleted' });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

export default userRouter;
