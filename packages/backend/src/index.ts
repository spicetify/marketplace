import App from "./server/app";
import IndexController from "@/controllers/indexController";
import { port } from "./server/config";

const app = new App([new IndexController()]);
app.listen(port);
