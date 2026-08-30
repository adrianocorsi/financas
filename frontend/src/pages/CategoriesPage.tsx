import { FormEvent, useEffect, useState } from "react";
import { categoriesApi } from "../api/categories";
import { Category, EntryType } from "../types";

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<EntryType>("despesa");
  const [color, setColor] = useState("#2563eb");

  function reload() {
    categoriesApi.list().then(setCategories);
  }

  useEffect(reload, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await categoriesApi.create({ name, type, color });
    setName("");
    setShowForm(false);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta categoria?")) return;
    await categoriesApi.remove(id);
    reload();
  }

  return (
    <>
      <div className="page-header">
        <h2>Categorias</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancelar" : "+ Nova categoria"}
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
              <select value={type} onChange={(e) => setType(e.target.value as EntryType)}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </label>
            <label>
              Cor
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
          </div>
          <button className="btn btn-primary" type="submit">
            Salvar
          </button>
        </form>
      )}

      {categories.length === 0 ? (
        <p className="empty-state">Nenhuma categoria cadastrada</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Cor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.type === "despesa" ? "Despesa" : "Receita"}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: category.color ?? "#ccc",
                      }}
                    />
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(category._id)}>
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
