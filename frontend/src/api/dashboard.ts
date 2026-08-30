import { apiClient } from "./client";
import { ComparativoMensalPonto, FluxoCaixaPonto, GastoPorCategoria, PendenciasAnteriores, ResumoMensal } from "../types";

export const dashboardApi = {
  resumoMensal: (month: number, year: number) =>
    apiClient.get<ResumoMensal>("/dashboard/resumo-mensal", { params: { month, year } }).then((r) => r.data),

  gastosPorCategoria: (month: number, year: number, type: "receita" | "despesa" = "despesa") =>
    apiClient
      .get<GastoPorCategoria[]>("/dashboard/gastos-por-categoria", { params: { month, year, type } })
      .then((r) => r.data),

  fluxoCaixa: (monthStart: number, monthEnd: number, year: number) =>
    apiClient
      .get<FluxoCaixaPonto[]>("/dashboard/fluxo-caixa", {
        params: { month_start: monthStart, month_end: monthEnd, year },
      })
      .then((r) => r.data),

  comparativoMensal: (year: number) =>
    apiClient
      .get<ComparativoMensalPonto[]>("/dashboard/comparativo-mensal", { params: { year } })
      .then((r) => r.data),

  projecaoSaldo: (monthsAhead: number) =>
    apiClient.get("/dashboard/projecao-saldo", { params: { months_ahead: monthsAhead } }).then((r) => r.data),

  evolucaoPatrimonio: (year: number) =>
    apiClient.get("/dashboard/evolucao-patrimonio", { params: { year } }).then((r) => r.data),

  pendenciasAnteriores: (month: number, year: number) =>
    apiClient
      .get<PendenciasAnteriores>("/dashboard/pendencias-anteriores", { params: { month, year } })
      .then((r) => r.data),
};
