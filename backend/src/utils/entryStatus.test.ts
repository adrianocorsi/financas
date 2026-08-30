import { computeEntryStatus } from "./entryStatus";

describe("computeEntryStatus", () => {
  it("mantém cancelado independente das datas", () => {
    const status = computeEntryStatus({
      paidDate: null,
      dueDate: new Date("2020-01-01"),
      currentStatus: "cancelado",
    });
    expect(status).toBe("cancelado");
  });

  it("retorna pago quando há paidDate", () => {
    const status = computeEntryStatus({
      paidDate: new Date(),
      dueDate: new Date("2020-01-01"),
      currentStatus: "pendente",
    });
    expect(status).toBe("pago");
  });

  it("retorna atrasado quando dueDate já passou e não foi pago", () => {
    const status = computeEntryStatus({
      paidDate: null,
      dueDate: new Date("2000-01-01"),
      currentStatus: "pendente",
    });
    expect(status).toBe("atrasado");
  });

  it("retorna pendente quando dueDate ainda não chegou e não foi pago", () => {
    const dueDate = new Date();
    dueDate.setFullYear(dueDate.getFullYear() + 1);

    const status = computeEntryStatus({ paidDate: null, dueDate, currentStatus: "atrasado" });
    expect(status).toBe("pendente");
  });
});
