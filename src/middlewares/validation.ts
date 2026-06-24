import { Request, Response } from 'hyper-express';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

export const validateInput = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: Function) => {
    const errors: { [key: string]: string } = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = (req.body as any)[field];

      if (rules.required && !value) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (value) {
        if (rules.minLength && value.length < rules.minLength) {
          errors[field] = `${field} must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
        }

        if (rules.custom && !rules.custom(value)) {
          errors[field] = `${field} validation failed`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};
