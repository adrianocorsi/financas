import { FormEvent, useEffect, useState } from "react";
import { budgetsApi } from "../api/budgets";
import { categoriesApi } from "../api/categories";
import { MonthYearSelector } from "../components/common/MonthYearSelector";
import { BudgetStatus, Category } from "../types";
import { formatCurrency } from "../utils/format";

const today = new Date();

export function BudgetsPage() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [status, setStatus] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    budgetsApi
      .status(month, year)
      .then(setStatus)
      .finally(() => setLoading(false));
  }

  useEffect(reload, [month, year]);

  useEffect(() => {
    categoriesApi.list().then((cats) => {
      const despesas = cats.filter((c) => c.type === "despesa");
      setCategories(despesas);
      setCategoryId(despesas[0]?._id ?? "");
    });
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await budgetsApi.create({ categoryId, month, year, plannedAmount: Number(plannedAmount) });
    setPlannedAmount("");
    setShowForm(false);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este orçamento?")) return;
    await budgetsApi.remove(id);
    reload();
  }

  return (
    <>
      <div className="page-header">
        <h2>Orçamentos</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancelar" : "+ Novo orçamento"}
        </button>
      </div>

      <div className="filters">
        <MonthYearSelector month={month} year={year} onChange={(m, y) => (setMonth(m), setYear(y))} />
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: "1.5rem" }} onSubmit={handleCreate}>
          <div className="form-grid">
            <label>
              Categoria
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Valor planejado ({month}/{year})
              <input
                type="number"
                step="0.01"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                required
              />
            </label>
          </div>
          <button className="btn btn-primary" type="submit">
            Salvar
          </button>
        </form>
      )}

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : status.length === 0 ? (
        <p className="empty-state">Nenhum orçamento definido para este mês</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Planejado</th>
              <th>Gasto real</th>
              <th>% utilizado</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {status.map((item) => (
              <tr key={item.budgetId}>
                <td>{item.categoryName ?? "—"}</td>
                <td>{formatCurrency(item.plannedAmount)}</td>
                <td>{formatCurrency(item.gastoReal)}</td>
                <td>{item.percentualUtilizado.toFixed(0)}%</td>
                <td>
                  <span className={`badge ${item.estourado ? "badge-atrasado" : "badge-pago"}`}>
                    {item.estourado ? "Estourado" : "Dentro do previsto"}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.budgetId)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
