import User from '../models/userModel.js';
import { check, validationResult } from "express-validator";

export const signUpRules = () => {
    return [
        check('firstName')
        .not()
        .isEmpty()
        .withMessage('First Name is required'),
        check('lastName')
        .not()
        .isEmpty()
        .withMessage('Last Name is required'),
        check('mobileNumber')
        .not()
        .isEmpty()
        .withMessage('Mobile Number is required')
        .isMobilePhone()
        .withMessage('Invalid Number')
        .custom((value, {req}) => {
          return new Promise((resolve, reject) => {
            User.findOne({mobileNumber:req.body.mobileNumber}, function(err, user){
              if(err) {
                reject(new Error('Server Error'))
              }
              if(Boolean(user)) {
                reject(new Error('Mobile Number already in use'))
              }
              resolve(true)
            });
          });
        }),
        check('email')
        .not()
        .isEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid Email')
        .custom((value, {req}) => {
          return new Promise((resolve, reject) => {
            User.findOne({email:req.body.email}, function(err, user){
              if(err) {
                reject(new Error('Server Error'))
              }
              if(Boolean(user)) {
                reject(new Error('E-mail already in use'))
              }
              resolve(true)
            });
          });
        }),
        // Check Password
        check('password')
        .not()
        .isEmpty()
        .withMessage('Password is required'),
        // Check Password Confirmation
        check('confirmPassword', 'Passwords do not match')
        .exists()
        .custom((value, { req }) => value === req.body.password)
    ]
  }

export const signInRules = () => {
    return [
        check('email')
        .not()
        .isEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid Email')
        .custom((value, {req}) => {
          return new Promise((resolve, reject) => {
            User.findOne({email:req.body.email}, function(err, user){
              if(err) {
                reject(new Error('Server Error'))
              }
              if(Boolean(!user)) {
                reject(new Error('No User Found'))
              }
              resolve(true)
            });
          });
        }),

        check('password')
        .not()
        .isEmpty()
        .withMessage('Password is required'),
    ]
}

// Validates for all rules
export const validate = (req, res, next) => {
    const error = validationResult(req).formatWith(({ msg }) => msg);
    const hasError = !error.isEmpty();
    if (hasError) {
        res.status(422).json({ message: error.array() });
    } else {
        return next()
    }
}