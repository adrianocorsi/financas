import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  comparativoMensalHandler,
  evolucaoPatrimonioHandler,
  fluxoCaixaHandler,
  gastosPorCategoriaHandler,
  pendenciasAnterioresHandler,
  projecaoSaldoHandler,
  resumoMensalHandler,
} from "./dashboard.controller";
import {
  comparativoMensalQuerySchema,
  evolucaoPatrimonioQuerySchema,
  fluxoCaixaQuerySchema,
  gastosPorCategoriaQuerySchema,
  pendenciasAnterioresQuerySchema,
  projecaoSaldoQuerySchema,
  resumoMensalQuerySchema,
} from "./dashboard.validation";

const router = Router();

router.use(authMiddleware);

router.get("/resumo-mensal", validate({ query: resumoMensalQuerySchema }), resumoMensalHandler);
router.get("/gastos-por-categoria", validate({ query: gastosPorCategoriaQuerySchema }), gastosPorCategoriaHandler);
router.get("/fluxo-caixa", validate({ query: fluxoCaixaQuerySchema }), fluxoCaixaHandler);
router.get("/comparativo-mensal", validate({ query: comparativoMensalQuerySchema }), comparativoMensalHandler);
router.get("/projecao-saldo", validate({ query: projecaoSaldoQuerySchema }), projecaoSaldoHandler);
router.get("/evolucao-patrimonio", validate({ query: evolucaoPatrimonioQuerySchema }), evolucaoPatrimonioHandler);
router.get(
  "/pendencias-anteriores",
  validate({ query: pendenciasAnterioresQuerySchema }),
  pendenciasAnterioresHandler
);

export default router;
