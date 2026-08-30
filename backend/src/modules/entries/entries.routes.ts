import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/commonValidation";
import {
  baixarHandler,
  cancelarHandler,
  createHandler,
  deleteHandler,
  estornarHandler,
  getHandler,
  listHandler,
  updateHandler,
} from "./entries.controller";
import {
  baixarEntrySchema,
  createEntrySchema,
  listEntriesQuerySchema,
  updateEntrySchema,
} from "./entries.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", validate({ query: listEntriesQuerySchema }), listHandler);
router.post("/", validate({ body: createEntrySchema }), createHandler);
router.get("/:id", validate({ params: idParamSchema }), getHandler);
router.put("/:id", validate({ params: idParamSchema, body: updateEntrySchema }), updateHandler);
router.delete("/:id", validate({ params: idParamSchema }), deleteHandler);
router.patch("/:id/baixar", validate({ params: idParamSchema, body: baixarEntrySchema }), baixarHandler);
router.patch("/:id/cancelar", validate({ params: idParamSchema }), cancelarHandler);
router.patch("/:id/estornar", validate({ params: idParamSchema }), estornarHandler);

export default router;
