import { Response } from 'express';

export const successResponse = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res: Response, message: string, statusCode: number = 500, code?: string) => {
  res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};
