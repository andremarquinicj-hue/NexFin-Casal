"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useHouseholdData } from "./useHouseholdData";
import { createFinancialTransaction, createItem } from "@/lib/firestore";
import { addMonths, isoDate, parseMoney } from "@/lib/finance";

export default function QuickEntry({onClose}:{onClose:()=>void}){
 const {profile,user}=useAuth(); const {cards,accounts}=useHouseholdData();
 const [type,setType]=useState<"expense"|"income"|"card">("expense");
 const [description,setDescription]=useState("");
 const [amount,setAmount]=useState("");
 const [actualAmount,setActualAmount]=useState("");
 const [category,setCategory]=useState("Casa");
 const [date,setDate]=useState(isoDate(new Date()));
 const [actualDate,setActualDate]=useState(isoDate(new Date()));
 const [mode,setMode]=useState<"single"|"monthly"|"installments">("single");
 const [execution,setExecution]=useState<"planned"|"actual">("planned");
 const [parts,setParts]=useState(2);
 const [cardId,setCardId]=useState("");
 const [accountId,setAccountId]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{ if(execution==="actual" && !actualAmount) setActualAmount(amount); },[execution,amount,actualAmount]);
 useEffect(()=>{ if(type==="income" && category==="Casa") setCategory("Salário"); },[type,category]);

 async function save(e:React.FormEvent){
  e.preventDefault(); if(!profile?.householdId)return; setError("");
  const planned=parseMoney(amount); const actual=parseMoney(actualAmount || amount);
  if(planned<=0){setError("Informe um valor previsto maior que zero.");return;}
  if(execution==="actual" && type!=="card" && !accountId){setError("Selecione a conta bancária que recebeu ou pagou este lançamento.");return;}
  setSaving(true);
  const total=mode==="installments"?Math.max(2,parts):mode==="monthly"?24:1;
  const group=mode!=="single"?crypto.randomUUID():undefined;
  try{
   for(let i=0;i<total;i++){
    const isFirst=i===0; const realized=execution==="actual"&&isFirst;
    const data={
      description, amountPlanned:planned,
      amountActual:realized?actual:null,
      type,
      status:realized?(type==="income"?"received":"paid"):"planned",
      category,
      dueDate:addMonths(date,i),
      paidDate:realized?actualDate:null,
      recurrence:mode==="monthly"?"monthly":"none",
      recurrenceGroupId:mode==="monthly"?group:null,
      installmentGroupId:mode==="installments"?group:null,
      installmentNumber:mode==="installments"?i+1:null,
      installmentTotal:mode==="installments"?total:null,
      cardId:type==="card"?(cardId||null):null,
      accountId:type!=="card"?(accountId||null):null,
      createdBy:user?.uid||""
    };
    if(realized) await createFinancialTransaction(profile.householdId,data);
    else await createItem(profile.householdId,"transactions",data);
   }
   onClose();
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar o lançamento.");}
  finally{setSaving(false)}
 }

 return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={save} onMouseDown={e=>e.stopPropagation()}>
  <div className="modal-head"><div><h2>Novo lançamento</h2><p>Planeje agora ou registre um valor já realizado.</p></div><button type="button" onClick={onClose}><X/></button></div>
  <div className="segmented">{[["expense","Despesa"],["income","Entrada"],["card","Cartão"]].map(([v,l])=><button type="button" key={v} className={type===v?"selected":""} onClick={()=>setType(v as typeof type)}>{l}</button>)}</div>
  <div className="execution-switch">
    <button type="button" className={execution==="planned"?"active":""} onClick={()=>setExecution("planned")}><Clock3/><span><strong>Provisionar</strong><small>Vai acontecer depois</small></span></button>
    <button type="button" className={execution==="actual"?"active actual":""} onClick={()=>setExecution("actual")}><CheckCircle2/><span><strong>Já realizado</strong><small>Entrou ou saiu da conta</small></span></button>
  </div>
  <label>Descrição<input required value={description} onChange={e=>setDescription(e.target.value)} placeholder={type==="income"?"Ex.: Salário - André":"Ex.: Financiamento do carro"}/></label>
  <div className="form-grid"><label>Valor previsto<input required inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0,00"/></label><label>Vencimento / previsão<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label></div>
  {execution==="actual"&&<div className="realized-box"><div className="form-grid"><label>Valor realizado<input required inputMode="decimal" value={actualAmount} onChange={e=>setActualAmount(e.target.value)} placeholder={amount||"0,00"}/></label><label>Data do {type==="income"?"recebimento":"pagamento"}<input type="date" required value={actualDate} onChange={e=>setActualDate(e.target.value)}/></label></div><p>O valor realizado alimenta o Dashboard e, para entradas/despesas, atualiza automaticamente o saldo da conta escolhida.</p></div>}
  <label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}>{["Casa","Mercado","Veículo","Saúde","Lazer","Educação","Assinaturas","Salário","Investimentos","Outros"].map(x=><option key={x}>{x}</option>)}</select></label>
  {type==="card"?<label>Cartão<select required value={cardId} onChange={e=>setCardId(e.target.value)}><option value="">Selecione...</option>{cards.map(c=><option key={c.id} value={c.id}>{c.name} · {c.holder}</option>)}</select></label>:<label>Conta bancária {execution==="actual"?"(obrigatória)":"(opcional)"}<select required={execution==="actual"} value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">{execution==="actual"?"Selecione a conta...":"Não informar"}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.holder}</option>)}</select></label>}
  <label>Repetição<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="single">Somente este lançamento</option><option value="monthly">Recorrente mensal — provisionar 24 meses</option><option value="installments">Compra/conta parcelada</option></select></label>
  {mode==="installments"&&<label>Número de parcelas<input type="number" min="2" max="120" value={parts} onChange={e=>setParts(Number(e.target.value))}/></label>}
  {execution==="actual"&&mode!=="single"&&<div className="notice">Somente a primeira parcela/ocorrência será marcada como realizada. As próximas continuarão provisionadas automaticamente.</div>}
  {error&&<div className="error-box">{error}</div>}
  <button className="primary-btn wide" disabled={saving}>{saving?"Salvando...":execution==="actual"?"Salvar e atualizar saldo":"Salvar provisionamento"}</button>
 </form></div>
}
