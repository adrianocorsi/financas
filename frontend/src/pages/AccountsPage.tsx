import { FormEvent, useEffect, useState } from "react";
import { accountsApi } from "../api/accounts";
import { Account, AccountType } from "../types";
import { formatCurrency } from "../utils/format";

const TYPE_LABELS: Record<AccountType, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  cartao_credito: "Cartão de crédito",
  dinheiro: "Dinheiro",
  investimento: "Investimento",
};

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("corrente");
  const [initialBalance, setInitialBalance] = useState("0");

  function reload() {
    accountsApi.list().then(setAccounts);
  }

  useEffect(reload, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await accountsApi.create({ name, type, initialBalance: Number(initialBalance) });
    setName("");
    setInitialBalance("0");
    setShowForm(false);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta conta?")) return;
    await accountsApi.remove(id);
    reload();
  }

  async function loadBalance(id: string) {
    const result = await accountsApi.balance(id);
    setBalances((prev) => ({ ...prev, [id]: result.balance }));
  }

  return (
    <>
      <div className="page-header">
        <h2>Contas</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancelar" : "+ Nova conta"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: "1.5rem" }} onSubmit={handleCreate}>
          <div className="form-grid">
            <label>
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Tipo
              <select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Saldo inicial
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </label>
          </div>
          <button className="btn btn-primary" type="submit">
            Salvar
          </button>
        </form>
      )}

      {accounts.length === 0 ? (
        <p className="empty-state">Nenhuma conta cadastrada</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Saldo inicial</th>
              <th>Saldo atual</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account._id}>
                <td>{account.name}</td>
                <td>{TYPE_LABELS[account.type]}</td>
                <td>{formatCurrency(account.initialBalance)}</td>
                <td>
                  {balances[account._id] != null ? (
                    formatCurrency(balances[account._id])
                  ) : (
                    <button className="btn btn-sm" onClick={() => loadBalance(account._id)}>
                      Calcular
                    </button>
                  )}
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(account._id)}>
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
