import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/renda", label: "Renda" },
  { to: "/entries", label: "Lançamentos" },
  { to: "/budgets", label: "Orçamentos" },
  { to: "/accounts", label: "Contas" },
  { to: "/categories", label: "Categorias" },
];

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>💰 Finanças</h1>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
            {item.label}
          </NavLink>
        ))}
        <div className="logout" onClick={signOut}>
          Sair {user ? `(${user.name})` : ""}
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
