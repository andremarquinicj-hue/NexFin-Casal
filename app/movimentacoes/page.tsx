"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Search, Trash2, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import StatCard from "@/components/StatCard";
import SettleTransactionModal from "@/components/SettleTransactionModal";
import { useHouseholdData } from "@/components/useHouseholdData";
import { brl, monthKey, monthLabelFromKey, shiftMonthKey, summarize } from "@/lib/finance";
import { removeFinancialTransaction } from "@/lib/firestore";
import { Transaction } from "@/lib/types";

function normalize(value:string){
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

function statusLabel(t:Transaction){
 if(t.type==="transfer") return "Transferido";
 if(t.status==="planned") return "Previsto";
 if(t.status==="paid") return "Pago";
 if(t.status==="received") return "Recebido";
 if(t.status==="overdue") return "Atrasado";
 return t.status;
}

export default function Mov(){
 const {transactions,accounts,householdId}=useHouseholdData();
 const [filter,setFilter]=useState("all");
 const [selectedMonth,setSelectedMonth]=useState(monthKey());
 const [settling,setSettling]=useState<Transaction|null>(null);
 const [search,setSearch]=useState("");

 const items=useMemo(()=>{
  const q=normalize(search);
  return transactions.filter(t=>{
   if(!t.dueDate?.startsWith(selectedMonth) || t.type==="card") return false;
   if(filter==="card" && t.isCardInvoice!==true) return false;
   if(filter!=="all" && filter!=="card" && t.type!==filter) return false;
   if(!q) return true;
   const actual=t.amountActual??t.amountPlanned;
   const text=normalize([
    t.description,t.category,t.fromAccountName,t.toAccountName,
    String(t.amountPlanned),String(actual),
    brl(t.amountPlanned),brl(actual),
    String(t.amountPlanned).replace(".",","),String(actual).replace(".",",")
   ].filter(Boolean).join(" "));
   return text.includes(q);
  }).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 },[transactions,filter,selectedMonth,search]);

 const monthItems=useMemo(()=>transactions.filter(t=>t.dueDate?.startsWith(selectedMonth)&&t.type!=="card"),[transactions,selectedMonth]);
 const sum=summarize(monthItems);

 return <AppShell title="Movimentações" subtitle="Planejado e realizado, com busca rápida por nome ou valor">
  <div className="movements-toolbar">
   <div className="month-toolbar"><button onClick={()=>setSelectedMonth(shiftMonthKey(selectedMonth,-1))}><ArrowLeft/></button><div><span>Mês selecionado</span><strong>{monthLabelFromKey(selectedMonth)}</strong></div><button onClick={()=>setSelectedMonth(shiftMonthKey(selectedMonth,1))}><ArrowRight/></button></div>
   <div className="movement-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou valor..." inputMode="search"/>{search&&<button type="button" onClick={()=>setSearch("")} title="Limpar busca"><X/></button>}</div>
  </div>
  <div className="stats-grid movements-stats"><StatCard label="Entradas previstas" value={brl(sum.incomePlanned)} hint={`${brl(sum.incomeActual)} recebido`} /><StatCard label="Despesas previstas" value={brl(sum.expensePlanned)} hint={`${brl(sum.expenseActual)} pago`} /><StatCard label="Saldo previsto" value={brl(sum.plannedBalance)} hint={`Realizado: ${brl(sum.actualBalance)}`} /><StatCard label="Ainda a pagar" value={brl(sum.pending)} hint={`${brl(sum.incomePending)} ainda a receber`} /></div>
  <div className="filter-tabs">{[["all","Todos"],["income","Entradas"],["expense","Despesas"],["card","Faturas de cartão"],["transfer","Transferências"]].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={filter===v?"active":""}>{l}</button>)}</div>
  {search&&<div className="search-result-note"><strong>{items.length}</strong> resultado{items.length===1?"":"s"} para “{search}” em {monthLabelFromKey(selectedMonth)}.</div>}
  <section className="panel table-panel">{items.length?<div className="data-table"><div className="table-head"><span>Descrição</span><span>Vencimento</span><span>Status</span><span>Previsto</span><span>Realizado</span><span>Ações</span></div>{items.map(t=><div className="table-row" key={t.id}><div><strong>{t.description}</strong><small>{t.type==="transfer"?`${t.fromAccountName||"Origem"} → ${t.toAccountName||"Destino"}`:`${t.category}${t.installmentTotal?` · ${t.installmentNumber}/${t.installmentTotal}`:""}`}</small></div><span>{new Date(t.dueDate+"T12:00").toLocaleDateString("pt-BR")}</span><span className={`status ${t.status}`}>{statusLabel(t)}</span><strong>{t.type==="transfer"?"—":brl(t.amountPlanned)}</strong><div className="actual-cell"><strong>{t.amountActual!=null?brl(t.amountActual):"—"}</strong>{t.paidDate&&<small>{new Date(t.paidDate+"T12:00").toLocaleDateString("pt-BR")}</small>}</div><div className="row-actions">{t.status==="planned"&&t.type!=="transfer"&&<button className="settle-action" title={t.type==="income"?"Registrar recebimento":"Registrar pagamento"} onClick={()=>setSettling(t)}><CheckCircle2/></button>}<button title="Excluir" onClick={()=>confirm(t.type==="transfer"?"Excluir esta transferência? Os saldos das duas contas serão estornados.":"Excluir este lançamento?")&&removeFinancialTransaction(householdId,t.id)}><Trash2/></button></div></div>)}</div>:<Empty text={search?"Nenhum lançamento encontrado para esta busca.":"Nenhum lançamento neste mês."}/>}</section>
  {settling&&<SettleTransactionModal tx={settling} accounts={accounts} householdId={householdId} onClose={()=>setSettling(null)}/>} 
 </AppShell>
}
