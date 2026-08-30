import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/commonValidation";
import {
  balanceHandler,
  createHandler,
  deleteHandler,
  listHandler,
  updateHandler,
} from "./accounts.controller";
import { balanceQuerySchema, createAccountSchema, updateAccountSchema } from "./accounts.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", listHandler);
router.post("/", validate({ body: createAccountSchema }), createHandler);
router.put("/:id", validate({ params: idParamSchema, body: updateAccountSchema }), updateHandler);
router.delete("/:id", validate({ params: idParamSchema }), deleteHandler);
router.get(
  "/:id/balance",
  validate({ params: idParamSchema, query: balanceQuerySchema }),
  balanceHandler
);

export default router;
