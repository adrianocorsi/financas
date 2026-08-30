import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { loginHandler, refreshHandler, registerHandler } from "./auth.controller";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validation";

const router = Router();

router.post("/register", validate({ body: registerSchema }), registerHandler);
router.post("/login", validate({ body: loginSchema }), loginHandler);
router.post("/refresh", validate({ body: refreshSchema }), refreshHandler);

export default router;
