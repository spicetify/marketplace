import { Router } from "express";

export default interface Controller {
	name: string;
	path: string;
	router: Router;
}
