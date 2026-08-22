import { Request, Response, NextFunction } from "express";
import healthService from "./health.service";

class HealthController {
  public async getHealth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const health = await healthService.getHealth();

      const statusCode =
        health.status === "ok" ? 200 : 503;

      return res.status(statusCode).json(health);
    } catch (error) {
      next(error);
    }
  }
}

export default new HealthController();