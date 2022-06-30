import express, { Application, json } from "express";

import Controller from "@/interfaces/controller";
import debug from "debug";
import { logger } from "./config";

export default class App {
  express: Application;
  logger: debug.Debugger;

  constructor(controllers: Controller[]) {
    this.logger = logger.extend("app");
    this.express = express();

    debug.enable("spicetify:*");

    this.initExpressSettings();
    this.initMiddlewares();
    this.initControllers(controllers);
  }

  private initExpressSettings(): void {
    this.logger("Initializing Express Settings");
    this.express.set("trust proxy", true).set("json escape", true);
  }

  private initMiddlewares(): void {
    this.logger("Initializing middlewares");
    this.express.use(json());
  }

  private initControllers(controllers: Controller[]): void {
    this.logger("Initializing controllers");
    controllers.forEach(async controller => {
      this.logger(`Loading controller ${controller.name}`);
      await this.express.use(controller.path, controller.router);
    });
  }

  listen(port: number): void {
    this.express.listen(port, "127.0.0.1", () => {
      this.logger(`Server is ready on port ${port}`);
    });
  }
}
