import { config } from "dotenv";
import debug from "debug";
config({ path: "./.env" });

export const logger: debug.Debugger = debug("spicetify:backend");
export const port = Number(process.env.PORT) || 3000;
