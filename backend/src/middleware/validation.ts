import { Request, Response, NextFunction, RequestHandler } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// 입력 유효성 검사 결과 확인
export const validateRequest: RequestHandler = (req, res, next): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
    return; // 🔹 Explicit return to satisfy TypeScript
  }

  next();
};

// 회원가입 유효성 검사 규칙
const registerValidationRules: ValidationChain[] = [
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력해주세요'),
  body('name').notEmpty().withMessage('이름은 필수 입력 항목입니다'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  body('role')
    .isIn(['mentor', 'mentee'])
    .withMessage('역할은 mentor 또는 mentee 중 하나여야 합니다'),
];

// 로그인 유효성 검사 규칙
const loginValidationRules: ValidationChain[] = [
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력해주세요'),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요'),
];

// **👀 이 부분을 RequestHandler[] 타입으로 명시**
export const registerValidation: RequestHandler[] = [
  ...registerValidationRules,
  validateRequest,
];
export const loginValidation: RequestHandler[] = [
  ...loginValidationRules,
  validateRequest,
];
