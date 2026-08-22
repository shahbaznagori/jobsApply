import { Router } from "express";

import healthRoute from "../src/api/health/health.route";
import applicationRoute from "../src/api/applications/application.route";


class AppRoutes {
  public readonly router: Router;

  constructor() {
    this.router = Router();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(healthRoute);
    this.router.use(applicationRoute);

  }
}

export default new AppRoutes().router;