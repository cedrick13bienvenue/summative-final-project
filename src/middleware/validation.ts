import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validationOptions } from '../validation/schemas';

// Generic validation middleware
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    
    const { error, value } = schema.validate(data, validationOptions);
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          details: errorDetails
        }
      });
      return;
    }
    
    // Replace the original data with validated and sanitized data
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    }
    
    next();
  };
};

// Specific validation middlewares for common use cases
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body');
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query');
export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params');

// Custom validation for specific fields
export const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Email is required',
        statusCode: 400
      }
    });
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Please provide a valid email address',
        statusCode: 400
      }
    });
    return;
  }
  
  next();
};

export const validatePassword = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;
  
  if (!password) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Password is required',
        statusCode: 400
      }
    });
    return;
  }
  
  if (password.length < 8) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Password must be at least 8 characters long',
        statusCode: 400
      }
    });
    return;
  }
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        statusCode: 400
      }
    });
    return;
  }
  
  next();
};

export const validateDate = (field: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dateValue = req.body[field];
    
    if (!dateValue) {
      res.status(400).json({
        success: false,
        error: {
          message: `${field} is required`,
          statusCode: 400
        }
      });
      return;
    }
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          message: `Please provide a valid date for ${field}`,
          statusCode: 400
        }
      });
      return;
    }
    
    if (date > new Date()) {
      res.status(400).json({
        success: false,
        error: {
          message: `${field} cannot be in the future`,
          statusCode: 400
        }
      });
      return;
    }
    
    next();
  };
};

export const validateUUID = (field: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuidValue = req.params[field] || req.body[field];
    
    if (!uuidValue) {
      res.status(400).json({
        success: false,
        error: {
          message: `${field} is required`,
          statusCode: 400
        }
      });
      return;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuidValue)) {
      res.status(400).json({
        success: false,
        error: {
          message: `Please provide a valid ${field}`,
          statusCode: 400
        }
      });
      return;
    }
    
    next();
  };
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  
  next();
};

// Rate limiting validation
export const validateRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // This would integrate with rate limiting middleware
  // For now, just pass through
  next();
};

// File upload validation (for future use)
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = (req as any).file;
    
    if (!file) {
      res.status(400).json({
        success: false,
        error: {
          message: 'File is required',
          statusCode: 400
        }
      });
      return;
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        error: {
          message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          statusCode: 400
        }
      });
      return;
    }
    
    if (file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: {
          message: `File size too large. Maximum size: ${maxSize} bytes`,
          statusCode: 400
        }
      });
      return;
    }
    
    next();
  };
};
