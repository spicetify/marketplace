import { config } from "dotenv";
import debug from "debug";
config({ path: "./.env" });

export const logger: debug.Debugger = debug("spicetify:backend"),
  port = Number(process.env.PORT) || 3000;
