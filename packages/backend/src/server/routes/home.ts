import { Request, Response } from "express";

export const home = async (req: Request, res: Response) => {
	return res
		.json({
			success: true,
			message: {
				time: new Date().toISOString()
			}
		})
		.end();
};
