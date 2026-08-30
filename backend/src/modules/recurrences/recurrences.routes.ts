import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/commonValidation";
import {
  createHandler,
  deleteHandler,
  generateMonthHandler,
  listHandler,
  updateHandler,
} from "./recurrences.controller";
import { createRecurrenceSchema, generateMonthSchema, updateRecurrenceSchema } from "./recurrences.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", listHandler);
router.post("/", validate({ body: createRecurrenceSchema }), createHandler);
router.put("/:id", validate({ params: idParamSchema, body: updateRecurrenceSchema }), updateHandler);
router.delete("/:id", validate({ params: idParamSchema }), deleteHandler);
router.post("/generate-month", validate({ body: generateMonthSchema }), generateMonthHandler);

export default router;
