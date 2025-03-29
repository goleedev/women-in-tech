import { RequestHandler } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// Check if the request body is valid when registering or logging in
export const validateRequest: RequestHandler = (req, res, next): void => {
  // Define the validation rules
  const errors = validationResult(req);

  // Check if there are validation errors
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });

    return;
  }

  next();
};

// Validation rules for user registration
const registerValidationRules: ValidationChain[] = [
  body('email').isEmail().withMessage('⚠️ Email is not valid'),
  body('name').notEmpty().withMessage('⚠️ Name is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('⚠️ Password must be at least 8 characters long'),
  body('role')
    .isIn(['mentor', 'mentee'])
    .withMessage('⚠️ Role must be either "mentor" or "mentee"'),
];

// Validation rules for user login
const loginValidationRules: ValidationChain[] = [
  body('email').isEmail().withMessage('⚠️ Email is not valid'),
  body('password').notEmpty().withMessage('⚠️ Password is required'),
];

// Define the validation rules for registration
export const registerValidation: RequestHandler[] = [
  ...registerValidationRules,
  validateRequest,
];

// Define the validation rules for login
export const loginValidation: RequestHandler[] = [
  ...loginValidationRules,
  validateRequest,
];
