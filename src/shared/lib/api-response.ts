import { Response } from 'express';

export const error = (
  res: Response,
  error: any,
  code: number,
) => {
  return res.status(code).json({
    status: 'error',
    code: code,
    message: error.message,
  });
};

export const success = (
  res: Response,
  message: string,
  code: number,
  data?: any,
) => {
  return res.status(code).json({
    status: 'success',
    message,
    code,
    data,
  });
};
