import { Transaction } from "./types";

export const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
export const monthLabel = (date = new Date()) => date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const addMonths = (dateString: string, months: number) => { const [y,m,d] = dateString.split("-").map(Number); const dt = new Date(y, m-1+months, Math.min(d,28)); return isoDate(dt); };

export function summarize(txs: Transaction[]) {
  const incomePlanned = txs.filter(t=>t.type==="income" && t.status!=="cancelled").reduce((s,t)=>s+t.amountPlanned,0);
  const incomeActual = txs.filter(t=>t.type==="income" && t.status==="received").reduce((s,t)=>s+(t.amountActual ?? t.amountPlanned),0);
  const expensePlanned = txs.filter(t=>(t.type==="expense"||t.type==="card") && t.status!=="cancelled").reduce((s,t)=>s+t.amountPlanned,0);
  const expenseActual = txs.filter(t=>(t.type==="expense"||t.type==="card") && t.status==="paid").reduce((s,t)=>s+(t.amountActual ?? t.amountPlanned),0);
  const pending = txs.filter(t=>(t.type==="expense"||t.type==="card") && !["paid","cancelled"].includes(t.status)).reduce((s,t)=>s+t.amountPlanned,0);
  return { incomePlanned, incomeActual, expensePlanned, expenseActual, pending, plannedBalance: incomePlanned-expensePlanned, actualBalance: incomeActual-expenseActual };
}

export function savingsInsights(txs: Transaction[], monthlyIncome: number) {
  const expenses = txs.filter(t=>t.type==="expense"||t.type==="card");
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
