import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/commonValidation";
import { createHandler, deleteHandler, listHandler, updateHandler } from "./categories.controller";
import { createCategorySchema, updateCategorySchema } from "./categories.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", listHandler);
router.post("/", validate({ body: createCategorySchema }), createHandler);
router.put("/:id", validate({ params: idParamSchema, body: updateCategorySchema }), updateHandler);
router.delete("/:id", validate({ params: idParamSchema }), deleteHandler);

export default router;
