import { FormEvent, useEffect, useMemo, useState } from "react";
import { accountsApi } from "../api/accounts";
import { categoriesApi } from "../api/categories";
import { EntriesFilter, entriesApi } from "../api/entries";
import { recurrencesApi } from "../api/recurrences";
import { MonthYearSelector } from "../components/common/MonthYearSelector";
import { Account, Category, Entry, EntryStatus, EntryType, Recurrence, RecurrenceFrequency } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

const today = new Date();

const STATUS_LABELS: Record<EntryStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  mensal: "Mensal",
  quinzenal: "Quinzenal",
  anual: "Anual",
};

const SEM_CATEGORIA = "__sem_categoria__";

interface EntryForm {
  description: string;
  type: EntryType;
  accountId: string;
  categoryId: string;
  amountExpected: string;
  dueDate: string;
  isRecurring: boolean;
  frequency: RecurrenceFrequency;
  endDate: string;
}

function emptyForm(accounts: Account[], categories: Category[]): EntryForm {
  return {
    description: "",
    type: "despesa",
    accountId: accounts[0]?._id ?? "",
    categoryId: categories.find((c) => c.type === "despesa")?._id ?? "",
    amountExpected: "",
    dueDate: today.toISOString().slice(0, 10),
    isRecurring: false,
    frequency: "mensal",
    endDate: "",
  };
}

function entryToForm(entry: Entry): EntryForm {
  return {
    description: entry.description,
    type: entry.type,
    accountId: entry.accountId,
    categoryId: entry.categoryId,
    amountExpected: String(entry.amountExpected),
    dueDate: entry.dueDate.slice(0, 10),
    isRecurring: false,
    frequency: "mensal",
    endDate: "",
  };
}

export function EntriesPage() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [status, setStatus] = useState<EntryStatus | "">("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyForm([], []));
  const [baixarState, setBaixarState] = useState<Record<string, { paidDate: string; amountPaid: string }>>({});

  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [showRecurrences, setShowRecurrences] = useState(false);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c._id, c])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a._id, a])), [accounts]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = entry.categoryId ?? SEM_CATEGORIA;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return [...groups.entries()].sort(([aId], [bId]) => {
      const aName = categoryById.get(aId)?.name ?? "Sem categoria";
      const bName = categoryById.get(bId)?.name ?? "Sem categoria";
      return aName.localeCompare(bName, "pt-BR");
    });
  }, [entries, categoryById]);

  useEffect(() => {
    Promise.all([accountsApi.list(), categoriesApi.list()]).then(([accs, cats]) => {
      setAccounts(accs);
      setCategories(cats);
      setForm(emptyForm(accs, cats));
    });
    loadRecurrences();
  }, []);

  function loadRecurrences() {
    recurrencesApi.list().then(setRecurrences);
  }

  function reload() {
    setLoading(true);
    const filter: EntriesFilter = { month, year };
    if (status) filter.status = status;
    entriesApi
      .list(filter)
      .then(setEntries)
      .finally(() => setLoading(false));
  }

  useEffect(reload, [month, year, status]);

  function openCreateForm() {
    setEditingEntryId(null);
    setForm(emptyForm(accounts, categories));
    setShowForm(true);
  }

  function openEditForm(entry: Entry) {
    setEditingEntryId(entry._id);
    setForm(entryToForm(entry));
    setShowForm(true);
  }

  function closeForm() {
    setEditingEntryId(null);
    setForm(emptyForm(accounts, categories));
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const dueDate = new Date(form.dueDate + "T00:00:00Z");

    if (editingEntryId) {
      await entriesApi.update(editingEntryId, {
        description: form.description,
        type: form.type,
        accountId: form.accountId,
        categoryId: form.categoryId,
        amountExpected: Number(form.amountExpected),
        dueDate: dueDate.toISOString(),
        competenceMonth: dueDate.getUTCMonth() + 1,
        competenceYear: dueDate.getUTCFullYear(),
      });
    } else if (form.isRecurring) {
      // Cria a regra de recorrência e já materializa o lançamento do mês de início,
      // para não precisar de uma tela separada só para "gerar o mês".
      await recurrencesApi.create({
        description: form.description,
        type: form.type,
        accountId: form.accountId,
        categoryId: form.categoryId,
        amount: Number(form.amountExpected),
        dayOfMonth: dueDate.getUTCDate(),
        frequency: form.frequency,
        startDate: dueDate.toISOString(),
        endDate: form.endDate ? new Date(form.endDate + "T00:00:00Z").toISOString() : null,
        active: true,
      });
      await recurrencesApi.generateMonth(dueDate.getUTCMonth() + 1, dueDate.getUTCFullYear());
      loadRecurrences();
    } else {
      await entriesApi.create({
        description: form.description,
        type: form.type,
        accountId: form.accountId,
        categoryId: form.categoryId,
        amountExpected: Number(form.amountExpected),
        dueDate: dueDate.toISOString(),
        competenceMonth: dueDate.getUTCMonth() + 1,
        competenceYear: dueDate.getUTCFullYear(),
      } as Partial<Entry>);
    }

    closeForm();
    reload();
  }

  async function handleBaixar(entry: Entry) {
    const state = baixarState[entry._id];
    if (!state) {
      setBaixarState((prev) => ({
        ...prev,
        [entry._id]: { paidDate: today.toISOString().slice(0, 10), amountPaid: String(entry.amountExpected) },
      }));
      return;
    }
    await entriesApi.baixar(entry._id, {
      paid_date: new Date(state.paidDate + "T00:00:00Z").toISOString(),
      amount_paid: Number(state.amountPaid),
    });
    setBaixarState((prev) => {
      const { [entry._id]: _removed, ...rest } = prev;
      return rest;
    });
    reload();
  }

  async function handleCancelar(id: string) {
    await entriesApi.cancelar(id);
    reload();
  }

  async function handleEstornar(id: string) {
    await entriesApi.estornar(id);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await entriesApi.remove(id);
    reload();
  }

  async function handleDeleteRecurrence(id: string) {
    if (!confirm("Excluir esta recorrência? Os lançamentos já gerados não são apagados.")) return;
    await recurrencesApi.remove(id);
    loadRecurrences();
  }

  async function handleGenerateMonth() {
    const result = await recurrencesApi.generateMonth(month, year);
    reload();
    alert(`${result.generated} lançamento(s) gerado(s) para o período selecionado`);
  }

  function renderEntryRow(entry: Entry) {
    const baixando = baixarState[entry._id];
    return (
      <tr key={entry._id}>
        <td>
          {formatDate(entry.dueDate)} {entry.isRecurring && <span title="Lançamento recorrente">🔁</span>}
        </td>
        <td>{entry.description}</td>
        <td>{accountById.get(entry.accountId)?.name ?? "—"}</td>
        <td>{formatCurrency(entry.amountExpected)}</td>
        <td>{entry.amountPaid != null ? formatCurrency(entry.amountPaid) : "—"}</td>
        <td>
          <span className={`badge badge-${entry.status}`}>{STATUS_LABELS[entry.status]}</span>
        </td>
        <td>
          <button className="btn btn-sm" onClick={() => openEditForm(entry)}>
            Editar
          </button>{" "}
          {(entry.status === "pendente" || entry.status === "atrasado") && (
            <>
              {baixando ? (
                <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                  <input
                    type="date"
                    value={baixando.paidDate}
                    onChange={(e) =>
                      setBaixarState((prev) => ({
                        ...prev,
                        [entry._id]: { ...prev[entry._id], paidDate: e.target.value },
                      }))
                    }
                  />
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: "80px" }}
                    value={baixando.amountPaid}
                    onChange={(e) =>
                      setBaixarState((prev) => ({
                        ...prev,
                        [entry._id]: { ...prev[entry._id], amountPaid: e.target.value },
                      }))
                    }
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => handleBaixar(entry)}>
                    Confirmar
                  </button>
                </span>
              ) : (
                <button className="btn btn-sm" onClick={() => handleBaixar(entry)}>
                  Baixar
                </button>
              )}{" "}
              <button className="btn btn-sm" onClick={() => handleCancelar(entry._id)}>
                Cancelar
              </button>
            </>
          )}
          {entry.status === "pago" && (
            <button className="btn btn-sm" onClick={() => handleEstornar(entry._id)}>
              Estornar
            </button>
          )}{" "}
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry._id)}>
            Excluir
          </button>
        </td>
      </tr>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>Lançamentos</h2>
        <button className="btn btn-primary" onClick={() => (showForm ? closeForm() : openCreateForm())}>
          {showForm ? "Cancelar" : "+ Novo lançamento"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: "1.5rem" }} onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>{editingEntryId ? "Editar lançamento" : "Novo lançamento"}</h3>
          <div className="form-grid">
            <label>
              Descrição
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>
            <label>
              Tipo
              <select
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value as EntryType;
                  // Categoria pertence a um tipo específico — trocar o tipo sem realinhar a
                  // categoria deixava o categoryId antigo "pendurado", salvando uma categoria
                  // de despesa num lançamento de receita (ou vice-versa) sem o usuário notar.
                  const stillValid = categories.some((c) => c._id === form.categoryId && c.type === newType);
                  const fallback = categories.find((c) => c.type === newType)?._id ?? "";
                  setForm({ ...form, type: newType, categoryId: stillValid ? form.categoryId : fallback });
                }}
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </label>
            <label>
              Conta
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Categoria
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                {categories
                  .filter((c) => c.type === form.type)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Valor previsto
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amountExpected}
                onChange={(e) => setForm({ ...form, amountExpected: e.target.value })}
                required
              />
            </label>
            <label>
              {form.isRecurring ? "Vencimento (1ª ocorrência)" : "Vencimento"}
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </label>
          </div>

          {!editingEntryId && (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                />
                🔁 É um lançamento recorrente (repete todo mês/período)
              </label>

              {form.isRecurring && (
                <div className="form-grid">
                  <label>
                    Frequência
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value as RecurrenceFrequency })}
                    >
                      {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Repetir até (opcional)
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </>
          )}

          <button className="btn btn-primary" type="submit">
            {editingEntryId ? "Salvar alterações" : "Salvar"}
          </button>
        </form>
      )}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setShowRecurrences((s) => !s)}
        >
          <h3 style={{ margin: 0 }}>🔁 Recorrências ativas ({recurrences.filter((r) => r.active).length})</h3>
          <span>{showRecurrences ? "▲ ocultar" : "▼ ver"}</span>
        </div>

        {showRecurrences && (
          <div style={{ marginTop: "1rem" }}>
            <div className="filters">
              <button
                className="btn btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateMonth();
                }}
              >
                Gerar lançamentos de {month}/{year} agora
              </button>
              <span className="empty-state" style={{ padding: 0 }}>
                (o job automático também roda todo dia 1, às 01:00)
              </span>
            </div>

            {recurrences.length === 0 ? (
              <p className="empty-state">Nenhuma recorrência cadastrada ainda</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Dia</th>
                    <th>Frequência</th>
                    <th>Início</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recurrences.map((r) => (
                    <tr key={r._id}>
                      <td>{r.description}</td>
                      <td>{formatCurrency(r.amount)}</td>
                      <td>{r.dayOfMonth}</td>
                      <td>{FREQUENCY_LABELS[r.frequency]}</td>
                      <td>{formatDate(r.startDate)}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRecurrence(r._id)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="filters">
        <MonthYearSelector month={month} year={year} onChange={(m, y) => (setMonth(m), setYear(y))} />
        <select value={status} onChange={(e) => setStatus(e.target.value as EntryStatus | "")}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="empty-state">Carregando...</p>
      ) : entries.length === 0 ? (
        <p className="empty-state">Nenhum lançamento neste período</p>
      ) : (
        groupedEntries.map(([categoryId, categoryEntries]) => {
          const category = categoryById.get(categoryId);
          const totalPrevisto = categoryEntries.reduce((sum, e) => sum + e.amountExpected, 0);
          const totalPago = categoryEntries.reduce((sum, e) => sum + (e.amountPaid ?? 0), 0);

          return (
            <div key={categoryId} style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: category?.color ?? "#9ca3af",
                  }}
                />
                <strong>{category?.name ?? "Sem categoria"}</strong>
                <span className="empty-state" style={{ padding: 0 }}>
                  {categoryEntries.length} lançamento(s) · previsto {formatCurrency(totalPrevisto)} · pago{" "}
                  {formatCurrency(totalPago)}
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Descrição</th>
                    <th>Conta</th>
                    <th>Previsto</th>
                    <th>Pago</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>{categoryEntries.map(renderEntryRow)}</tbody>
              </table>
            </div>
          );
        })
      )}
    </>
  );
}
