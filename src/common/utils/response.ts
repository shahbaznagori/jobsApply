import { Response } from "express";

const apiResponse = (
  res: Response,
  status: number,
  success: boolean,
  message: string,
  data: unknown = null
) => {
  return res.status(status).json({
    status,
    success,
    message,
    data,
  });
};

export default apiResponse;