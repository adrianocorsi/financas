import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/dashboard";
import { MonthYearSelector } from "../components/common/MonthYearSelector";
import { GastoPorCategoria, PendenciasAnteriores, ResumoMensal } from "../types";
import { formatCurrency, formatCurrencyCompact, formatDate, MONTH_NAMES } from "../utils/format";

const PALETTE = ["#2563eb", "#16a34a", "#f97316", "#8b5cf6", "#ec4899", "#0891b2", "#d97706", "#dc2626"];
const HAIRLINE = "#e2e5ea";
const MUTED_TEXT = "#6b7280";

const today = new Date();

interface OrcadoRealizadoPonto {
  month: number;
  year: number;
  previsto: number;
  realizado: number;
}

// Barra com ponta arredondada (4px) e base reta na linha zero — nunca o contrário,
// já que "base reta" é a extremidade que encosta no eixo (0), e a ponta arredondada
// é a extremidade livre, esteja o valor acima ou abaixo de zero.
function RoundedBar(props: any) {
  const { x, y, width, height, fill, value, fillOpacity } = props;
  if (!width || !height) return <></>;

  // Recharts não normaliza o retângulo: para valores negativos ele passa `height`
  // negativo (e às vezes `width` negativo) em vez de inverter x/y. Normaliza aqui
  // para um canto top-left + largura/altura sempre positivos.
  const w = Math.abs(width);
  const h = Math.abs(height);
  const top = height < 0 ? y + height : y;
  const left = width < 0 ? x + width : x;

  const raw = typeof value === "number" ? value : Array.isArray(value) ? value[1] : 0;
  const isNegative = raw < 0;
  const r = Math.min(4, h / 2, w / 2);

  const d = isNegative
    ? `M${left},${top} L${left + w},${top} L${left + w},${top + h - r} Q${left + w},${top + h} ${left + w - r},${top + h} L${left + r},${top + h} Q${left},${top + h} ${left},${top + h - r} Z`
    : `M${left},${top + h} L${left + w},${top + h} L${left + w},${top + r} Q${left + w},${top} ${left + w - r},${top} L${left + r},${top} Q${left},${top} ${left},${top + r} Z`;

  return <path d={d} fill={fill} fillOpacity={fillOpacity ?? 1} />;
}

function OrcadoRealizadoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 8,
        padding: "0.6rem 0.75rem",
        fontSize: "0.8rem",
        boxShadow: "0 4px 12px rgba(11,11,11,0.08)",
      }}
    >
      <div style={{ color: MUTED_TEXT, marginBottom: 4 }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 10, height: 2, background: entry.color }} />
          <strong>{formatCurrency(entry.value)}</strong>
          <span style={{ color: MUTED_TEXT }}>{entry.name}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [resumo, setResumo] = useState<ResumoMensal | null>(null);
  const [gastos, setGastos] = useState<GastoPorCategoria[]>([]);
  const [orcadoRealizado, setOrcadoRealizado] = useState<OrcadoRealizadoPonto[]>([]);
  const [pendencias, setPendencias] = useState<PendenciasAnteriores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Últimos 6 meses terminando no mês selecionado: despesas orçadas vs realizadas.
    // Usa despesas (sempre >= 0), não saldo — saldo pode ser negativo e faz a barra
    // "pendurar" para baixo a partir do zero, o que lê como gráfico invertido.
    const monthsWindow: Array<{ month: number; year: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      monthsWindow.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    Promise.all([
      dashboardApi.resumoMensal(month, year),
      dashboardApi.gastosPorCategoria(month, year),
      Promise.all(monthsWindow.map((p) => dashboardApi.resumoMensal(p.month, p.year))),
      dashboardApi.pendenciasAnteriores(month, year),
    ])
      .then(([resumoData, gastosData, series, pendenciasData]) => {
        setResumo(resumoData);
        setGastos(gastosData);
        setOrcadoRealizado(
          series.map((s) => ({
            month: s.month,
            year: s.year,
            previsto: s.totalDespesasPrevistas,
            realizado: s.totalDespesasRealizadas,
          }))
        );
        setPendencias(pendenciasData);
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  // Orçado/Realizado/Diferença são sobre DESPESA, não saldo (receita − despesa).
  // Orçado = soma de todas as despesas do mês (pagas + pendentes); Realizado = só as pagas;
  // Diferença = orçado − realizado = quanto ainda falta pagar.
  const orcado = resumo?.totalDespesasPrevistas ?? 0;
  const realizado = resumo?.totalDespesasRealizadas ?? 0;
  const diferenca = orcado - realizado;

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <div className="filters">
          <MonthYearSelector month={month} year={year} onChange={(m, y) => (setMonth(m), setYear(y))} />
        </div>
      </div>

      {loading && <p className="empty-state">Carregando...</p>}

      {!loading && pendencias && pendencias.count > 0 && (
        <div className="alert-banner">
          <div className="alert-banner-header">
            <span>⚠️</span>
            <strong>
              Você tem {pendencias.count} lançamento{pendencias.count > 1 ? "s" : ""} em aberto de{" "}
              {pendencias.count > 1 ? "meses anteriores" : "mês anterior"}
            </strong>
            <span className="alert-banner-total">totalizando {formatCurrency(pendencias.total)}</span>
            <Link to="/entries" className="btn btn-sm alert-banner-action">
              Ver lançamentos
            </Link>
          </div>
          <ul className="alert-banner-list">
            {pendencias.entries.slice(0, 5).map((item) => (
              <li key={item.id}>
                <span className="alert-banner-competencia">
                  {MONTH_NAMES[item.competenceMonth - 1].slice(0, 3)}/{item.competenceYear}
                </span>
                <span>{item.description}</span>
                {item.categoryName && <span className="alert-banner-category">{item.categoryName}</span>}
                <span className="alert-banner-due">venceu {formatDate(item.dueDate)}</span>
                <strong>{formatCurrency(item.amountExpected)}</strong>
              </li>
            ))}
          </ul>
          {pendencias.entries.length > 5 && (
            <p className="alert-banner-more">e mais {pendencias.entries.length - 5}...</p>
          )}
        </div>
      )}

      {!loading && resumo && (
        <div className="grid-cards">
          <div className="card stat-card">
            <p className="label">Orçado</p>
            <p className="value">{formatCurrency(orcado)}</p>
            <p className="hint">soma de todas as despesas do mês (pagas + pendentes)</p>
          </div>
          <div className="card stat-card">
            <p className="label">Realizado</p>
            <p className="value">{formatCurrency(realizado)}</p>
            <p className="hint">soma das despesas já pagas</p>
          </div>
          <div className="card stat-card">
            <p className="label">Diferença</p>
            <p className={`value ${diferenca >= 0 ? "value-positive" : "value-negative"}`}>
              {formatCurrency(diferenca)}
            </p>
            <p className="hint">orçado − realizado: o que ainda falta pagar</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="charts-row">
          <div className="card">
            <h3>Gastos por categoria — {MONTH_NAMES[month - 1]}</h3>
            {gastos.length === 0 ? (
              <p className="empty-state">Sem despesas pagas neste mês</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={gastos}
                    dataKey="total"
                    nameKey="categoryName"
                    outerRadius={90}
                    label={(entry) => entry.categoryName ?? "Sem categoria"}
                  >
                    {gastos.map((entry, index) => (
                      <Cell key={entry.categoryId} fill={entry.categoryColor || PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h3>Despesas: Orçado x Realizado (6 meses)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orcadoRealizado} barGap={2} barCategoryGap="32%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={HAIRLINE} vertical={false} />
                <XAxis
                  dataKey={(p: OrcadoRealizadoPonto) => MONTH_NAMES[p.month - 1].slice(0, 3)}
                  axisLine={{ stroke: HAIRLINE }}
                  tickLine={false}
                  tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                  width={64}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                />
                <Tooltip content={<OrcadoRealizadoTooltip />} cursor={{ fill: "rgba(11,11,11,0.03)" }} />
                <Legend
                  iconType="plainline"
                  iconSize={16}
                  formatter={(value) => <span style={{ color: MUTED_TEXT }}>{value}</span>}
                />
                <Bar
                  dataKey="previsto"
                  fill="#2563eb"
                  name="Orçado"
                  shape={RoundedBar}
                  barSize={20}
                  activeBar={{ fillOpacity: 0.8 }}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="realizado"
                  fill="#16a34a"
                  name="Realizado"
                  shape={RoundedBar}
                  barSize={20}
                  activeBar={{ fillOpacity: 0.8 }}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
