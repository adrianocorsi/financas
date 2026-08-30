import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/commonValidation";
import { createHandler, deleteHandler, listHandler, statusHandler, updateHandler } from "./budgets.controller";
import {
  budgetsQuerySchema,
  budgetsStatusQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
} from "./budgets.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", validate({ query: budgetsQuerySchema }), listHandler);
router.get("/status", validate({ query: budgetsStatusQuerySchema }), statusHandler);
router.post("/", validate({ body: createBudgetSchema }), createHandler);
router.put("/:id", validate({ params: idParamSchema, body: updateBudgetSchema }), updateHandler);
router.delete("/:id", validate({ params: idParamSchema }), deleteHandler);

export default router;
