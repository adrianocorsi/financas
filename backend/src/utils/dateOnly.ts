// Datas de calendário (due_date, paid_date, competência, início/fim de recorrência) chegam
// via Zod `z.coerce.date()` a partir de strings ISO ("2026-08-10"), que o JS interpreta em UTC.
// Construir/ler essas mesmas datas usando os getters/constructor LOCAIS (new Date(y, m, d), getMonth())
// causa um desalinhamento de fuso horário: em qualquer timezone com offset negativo (ex: Brasil, UTC-3),
// meia-noite local de um dia vira ~3h da manhã UTC, então a data local acaba caindo um dia (ou mês) à
// frente/atrás da instância UTC equivalente ao comparar as duas.
// Por isso, toda construção/leitura de "dia de calendário" usa UTC de forma consistente aqui.

/** Constrói uma data de calendário (sem hora) em UTC. `month` é 1-based (1=janeiro). */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Trunca uma data para meia-noite UTC do mesmo dia-calendário UTC. */
export function toUTCDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
