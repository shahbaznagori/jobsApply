import { NextFunction, Request, Response } from "express";
import applicationService from "./application.service";
import apiResponse from "../../common/utils/response";

class ApplicationController {
  public async createApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const application = await applicationService.createApplication(
        req.body
      );

      return apiResponse(
        res,
        201,
        true,
        "Application submitted successfully",
        application
      );
    } catch (error) {
      next(error);
    }
  }

 public async getAllApplications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const applications =
       await applicationService.getAllApplications();
      console.log("applications", applications);

      return apiResponse(
        res,
        200,
        true,
        "Applications fetched successfully",
        applications
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ApplicationController();