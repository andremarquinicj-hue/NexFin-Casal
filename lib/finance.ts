import { Transaction } from "./types";

export const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
export const monthLabel = (date = new Date()) => date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const addMonths = (dateString: string, months: number) => { const [y,m,d] = dateString.split("-").map(Number); const dt = new Date(y, m-1+months, Math.min(d,28)); return isoDate(dt); };
export const parseMoney = (value: string | number) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = value.trim().replace(/\s/g, "").replace(/R\$/gi, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
export const monthKeyToDate = (key: string) => { const [y,m] = key.split("-").map(Number); return new Date(y, m-1, 1); };
export const shiftMonthKey = (key: string, months: number) => { const d = monthKeyToDate(key); d.setMonth(d.getMonth()+months); return monthKey(d); };
export const monthLabelFromKey = (key: string) => monthLabel(monthKeyToDate(key));

// Fluxo de caixa: compras individuais no cartão NÃO são despesas bancárias do mês.
// A saída de dinheiro acontece somente quando a fatura consolidada é paga.
export const isCashflowTransaction = (t: Transaction) => t.type !== "card";

// Análise por categoria: usa compras individuais do cartão para preservar a categoria real,
// mas exclui a fatura consolidada para não contar o mesmo gasto duas vezes.
export const isSpendingDetail = (t: Transaction) =>
  t.status !== "cancelled" &&
  (t.type === "card" || (t.type === "expense" && t.isCardInvoice !== true));

export function summarize(txs: Transaction[]) {
  const incomePlanned = txs.filter(t=>t.type==="income" && t.status!=="cancelled").reduce((s,t)=>s+t.amountPlanned,0);
  const incomeActual = txs.filter(t=>t.type==="income" && t.status==="received").reduce((s,t)=>s+(t.amountActual ?? t.amountPlanned),0);
  const expensePlanned = txs.filter(t=>t.type==="expense" && t.status!=="cancelled").reduce((s,t)=>s+t.amountPlanned,0);
  const expenseActual = txs.filter(t=>t.type==="expense" && t.status==="paid").reduce((s,t)=>s+(t.amountActual ?? t.amountPlanned),0);
  const pending = txs.filter(t=>t.type==="expense" && !["paid","cancelled"].includes(t.status)).reduce((s,t)=>s+t.amountPlanned,0);
  const incomePending = txs.filter(t=>t.type==="income" && !["received","cancelled"].includes(t.status)).reduce((s,t)=>s+t.amountPlanned,0);
  return { incomePlanned, incomeActual, expensePlanned, expenseActual, pending, incomePending, plannedBalance: incomePlanned-expensePlanned, actualBalance: incomeActual-expenseActual };
}

export function savingsInsights(txs: Transaction[], monthlyIncome: number) {
  const expenses = txs.filter(isSpendingDetail);
  const grouped = expenses.reduce<Record<string,number>>((acc,t)=>{ acc[t.category]=(acc[t.category]||0)+(t.amountActual ?? t.amountPlanned); return acc; },{});
  const playbook: Record<string,{rate:number;tip:string}> = {
    "Lazer": { rate:.15, tip:"Defina um teto mensal para lazer e acompanhe o quanto ainda resta antes de novas compras." },
    "Assinaturas": { rate:.20, tip:"Revise serviços repetidos ou pouco usados e teste cancelar um por mês." },
    "Mercado": { rate:.08, tip:"Crie um orçamento semanal e compare o realizado com a meta antes da próxima compra." },
    "Veículo": { rate:.05, tip:"Agrupe deslocamentos, acompanhe combustível e reserve manutenção para evitar gastos emergenciais." },
    "Casa": { rate:.05, tip:"Compare contas recorrentes e negocie internet, seguros e serviços sempre que houver reajuste." },
    "Outros": { rate:.10, tip:"Detalhe os gastos classificados como “Outros”; eles costumam esconder despesas fáceis de cortar." }
  };
  const suggestions = Object.entries(grouped)
    .filter(([category])=>Boolean(playbook[category]))
    .map(([category,value])=>({ category, value, save10:value*playbook[category].rate, save15:value*.15, tip:playbook[category].tip, rate:playbook[category].rate }))
    .sort((a,b)=>b.save10-a.save10).slice(0,3);
  const realisticMonthly = suggestions.reduce((s,x)=>s+x.save10,0);
  return { suggestions, realisticMonthly, yearProjection: realisticMonthly*12, savingsRate: monthlyIncome ? (realisticMonthly/monthlyIncome)*100 : 0 };
}
