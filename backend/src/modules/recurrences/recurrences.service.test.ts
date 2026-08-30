import { clampDay, dueDatesForRecurrence } from "./recurrences.service";
import { utcDate } from "../../utils/dateOnly";

describe("clampDay", () => {
  it("mantém o dia quando ele existe no mês", () => {
    expect(clampDay(2026, 8, 15)).toBe(15);
  });

  it("reduz para o último dia do mês quando o dia não existe (fevereiro)", () => {
    expect(clampDay(2026, 2, 31)).toBe(28); // 2026 não é bissexto
    expect(clampDay(2024, 2, 31)).toBe(29); // 2024 é bissexto
  });

  it("reduz para 30 em meses com 30 dias", () => {
    expect(clampDay(2026, 4, 31)).toBe(30);
  });
});

describe("dueDatesForRecurrence", () => {
  const startDate = new Date("2026-01-01");

  it("gera uma data para frequência mensal", () => {
    const dates = dueDatesForRecurrence({ dayOfMonth: 10, frequency: "mensal", startDate }, 8, 2026);
    expect(dates).toHaveLength(1);
    expect(dates[0]).toEqual(utcDate(2026, 8, 10));
  });

  it("gera duas datas para frequência quinzenal", () => {
    const dates = dueDatesForRecurrence({ dayOfMonth: 5, frequency: "quinzenal", startDate }, 8, 2026);
    expect(dates).toHaveLength(2);
    expect(dates[0]).toEqual(utcDate(2026, 8, 5));
    expect(dates[1]).toEqual(utcDate(2026, 8, 20));
  });

  it("gera apenas uma data para frequência anual, só no mês de início", () => {
    const anualStart = new Date("2026-03-01");
    const noMes = dueDatesForRecurrence({ dayOfMonth: 1, frequency: "anual", startDate: anualStart }, 3, 2026);
    const foraDoMes = dueDatesForRecurrence({ dayOfMonth: 1, frequency: "anual", startDate: anualStart }, 4, 2026);

    expect(noMes).toHaveLength(1);
    expect(foraDoMes).toHaveLength(0);
  });
});
