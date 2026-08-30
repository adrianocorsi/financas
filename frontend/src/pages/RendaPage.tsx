import { FormEvent, useEffect, useState } from "react";
import { accountsApi } from "../api/accounts";
import { categoriesApi } from "../api/categories";
import { dashboardApi } from "../api/dashboard";
import { recurrencesApi } from "../api/recurrences";
import { MonthYearSelector } from "../components/common/MonthYearSelector";
import { Account, Recurrence, ResumoMensal } from "../types";
import { formatCurrency } from "../utils/format";

const today = new Date();
const RENDA_CATEGORY_NAME = "Renda";

interface FonteForm {
  description: string;
  amount: string;
  dayOfMonth: string;
  accountId: string;
}

function emptyForm(accounts: Account[]): FonteForm {
  return { description: "", amount: "", dayOfMonth: String(today.getDate()), accountId: accounts[0]?._id ?? "" };
}

export function RendaPage() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [resumo, setResumo] = useState<ResumoMensal | null>(null);
  const [fontes, setFontes] = useState<Recurrence[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FonteForm>(emptyForm([]));

  useEffect(() => {
    accountsApi.list().then((accs) => {
      setAccounts(accs);
      setForm(emptyForm(accs));
    });
  }, []);

  function reload() {
    setLoading(true);
    Promise.all([dashboardApi.resumoMensal(month, year), recurrencesApi.list()])
      .then(([resumoData, recurrences]) => {
        setResumo(resumoData);
        setFontes(recurrences.filter((r) => r.type === "receita"));
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [month, year]);

  // Toda fonte de renda cadastrada aqui usa a mesma categoria "Renda" — o usuário
  // não precisa pensar em categorias, só em "quanto eu recebo e quando".
  async function getOrCreateRendaCategoryId(): Promise<string> {
    const categories = await categoriesApi.list();
    const existing = categories.find(
      (c) => c.type === "receita" && c.name.trim().toLowerCase() === RENDA_CATEGORY_NAME.toLowerCase()
    );
    if (existing) return existing._id;
    const created = await categoriesApi.create({ name: RENDA_CATEGORY_NAME, type: "receita", color: "#16a34a" });
    return created._id;
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm(accounts));
    setShowForm(true);
  }

  function openEditForm(fonte: Recurrence) {
    setEditingId(fonte._id);
    setForm({
      description: fonte.description,
      amount: String(fonte.amount),
      dayOfMonth: String(fonte.dayOfMonth),
      accountId: fonte.accountId,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (editingId) {
      await recurrencesApi.update(editingId, {
        description: form.description,
        amount: Number(form.amount),
        dayOfMonth: Number(form.dayOfMonth),
        accountId: form.accountId,
      });
    } else {
      const categoryId = await getOrCreateRendaCategoryId();
      await recurrencesApi.create({
        description: form.description,
        type: "receita",
        accountId: form.accountId,
        categoryId,
        amount: Number(form.amount),
        dayOfMonth: Number(form.dayOfMonth),
        frequency: "mensal",
        startDate: new Date(year, month - 1, 1).toISOString(),
        active: true,
      });
      await recurrencesApi.generateMonth(month, year);
    }

    setShowForm(false);
    setEditingId(null);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta fonte de renda? Lançamentos já gerados não são apagados.")) return;
    await recurrencesApi.remove(id);
    reload();
  }

  // Sempre soma o cadastro de fontes de renda (fixo, independe do mês) — não o total de
  // "receitas" da tabela de lançamentos, que só existe depois que o mês foi gerado/materializado.
  // Assim "Quanto entra" é igual em qualquer mês, até o usuário mudar o cadastro em si.
  const rendaMensal = fontes.filter((f) => f.active).reduce((sum, f) => sum + f.amount, 0);
  const sobra = resumo ? rendaMensal - resumo.totalDespesasPrevistas : 0;

  return (
    <>
      <div className="page-header">
        <h2>Renda</h2>
        <button className="btn btn-primary" onClick={() => (showForm ? setShowForm(false) : openCreateForm())}>
          {showForm ? "Cancelar" : "+ Nova fonte de renda"}
        </button>
      </div>

      <div className="filters">
        <MonthYearSelector month={month} year={year} onChange={(m, y) => (setMonth(m), setYear(y))} />
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: "1.5rem" }} onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>{editingId ? "Editar fonte de renda" : "Nova fonte de renda"}</h3>
          <div className="form-grid">
            <label>
              Descrição
              <input
                placeholder="Ex.: Salário Adriano, Salário Elaine"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>
            <label>
              Valor mensal
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>
            <label>
              Dia do mês que recebe
              <input
                type="number"
                min="1"
                max="31"
                value={form.dayOfMonth}
                onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                required
              />
            </label>
            <label>
              Conta de destino
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="btn btn-primary" type="submit">
            {editingId ? "Salvar alterações" : "Salvar"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : (
        resumo && (
          <div className="grid-cards">
            <div className="card stat-card">
              <p className="label">Quanto entra</p>
              <p className="value value-positive">{formatCurrency(rendaMensal)}</p>
              <p className="hint">soma do cadastro de fontes de renda — igual em todo mês</p>
            </div>
            <div className="card stat-card">
              <p className="label">Quanto gasto</p>
              <p className="value value-negative">{formatCurrency(resumo.totalDespesasPrevistas)}</p>
              <p className="hint">despesas previstas do mês selecionado</p>
            </div>
            <div className="card stat-card">
              <p className="label">Sobra</p>
              <p className={`value ${sobra >= 0 ? "value-positive" : "value-negative"}`}>{formatCurrency(sobra)}</p>
              <p className="hint">renda cadastrada − despesas do mês</p>
            </div>
          </div>
        )
      )}

      <h3>Fontes de renda cadastradas ({formatCurrency(rendaMensal)}/mês)</h3>
      {fontes.length === 0 ? (
        <p className="empty-state">
          Nenhuma fonte de renda cadastrada ainda. Clique em "+ Nova fonte de renda" para adicionar seu salário (e o da
          sua esposa, se for o caso).
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor mensal</th>
                <th>Dia do recebimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fontes.map((fonte) => (
                <tr key={fonte._id}>
                  <td>{fonte.description}</td>
                  <td>{formatCurrency(fonte.amount)}</td>
                  <td>{fonte.dayOfMonth}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => openEditForm(fonte)}>
                      Editar
                    </button>{" "}
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(fonte._id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
