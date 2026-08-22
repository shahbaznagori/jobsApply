import { Router } from "express";
import healthController from "./health.controller";

class HealthRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get(
      "/health",
      healthController.getHealth.bind(healthController)
    );
  }
}

export default new HealthRoute().router;