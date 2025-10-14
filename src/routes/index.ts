import { Router, Request, Response } from "express";

const router = Router();

// GET
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from example router!" });
});

export default router;
