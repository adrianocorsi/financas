export type EntryType = "receita" | "despesa";
export type EntryStatus = "pendente" | "pago" | "atrasado" | "cancelado";
export type AccountType = "corrente" | "poupanca" | "cartao_credito" | "dinheiro" | "investimento";
export type RecurrenceFrequency = "mensal" | "quinzenal" | "anual";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Account {
  _id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  closingDay?: number;
}

export interface Category {
  _id: string;
  name: string;
  type: EntryType;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface Entry {
  _id: string;
  accountId: string;
  categoryId: string;
  description: string;
  type: EntryType;
  amountExpected: number;
  amountPaid: number | null;
  dueDate: string;
  paidDate: string | null;
  competenceMonth: number;
  competenceYear: number;
  status: EntryStatus;
  isRecurring: boolean;
  recurrenceId: string | null;
  notes?: string;
}

export interface Recurrence {
  _id: string;
  description: string;
  categoryId: string;
  accountId: string;
  type: EntryType;
  amount: number;
  dayOfMonth: number;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export interface Budget {
  _id: string;
  categoryId: string;
  month: number;
  year: number;
  plannedAmount: number;
}

export interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  month: number;
  year: number;
  plannedAmount: number;
  gastoReal: number;
  percentualUtilizado: number;
  estourado: boolean;
}

export interface ResumoMensal {
  month: number;
  year: number;
  totalReceitasPrevistas: number;
  totalReceitasRealizadas: number;
  totalDespesasPrevistas: number;
  totalDespesasRealizadas: number;
  saldoPrevisto: number;
  saldoRealizado: number;
  percentualGasto: number;
}

export interface GastoPorCategoria {
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  total: number;
  quantidadeLancamentos: number;
  ticketMedio: number;
}

export interface FluxoCaixaPonto {
  month: number;
  year: number;
  entradas: number;
  saidas: number;
  saldoDoMes: number;
  saldoAcumulado: number;
}

export interface PendenciaAnterior {
  id: string;
  description: string;
  amountExpected: number;
  dueDate: string;
  competenceMonth: number;
  competenceYear: number;
  status: EntryStatus;
  categoryName?: string;
  categoryColor?: string;
}

export interface PendenciasAnteriores {
  count: number;
  total: number;
  entries: PendenciaAnterior[];
}

export interface ComparativoMensalPonto {
  month: number;
  year: number;
  entradas: number;
  saidas: number;
  saldo: number;
  variacaoPercentual: number | null;
}
