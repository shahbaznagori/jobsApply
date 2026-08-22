import { Router } from "express";
import applicationController from "./application.controller";
import {
  createApplicationValidation,
} from "./application.validation";
import validationMiddleware from "../../common/utils/middleware/validation.middleware";

class ApplicationRoute {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post(
      "/api/applications",
      createApplicationValidation,
      validationMiddleware,
      applicationController.createApplication.bind(
        applicationController
      )
    );

     this.router.post( "/api/applications", applicationController.createApplication.bind(applicationController));

    this.router.get("/api/applications", applicationController.getAllApplications.bind(applicationController));

  }
}

export default new ApplicationRoute().router;