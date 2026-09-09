"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2, Clock3, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useHouseholdData } from "./useHouseholdData";
import { createBankTransfer, createCardPurchase, createFinancialTransaction, createItem } from "@/lib/firestore";
import { addMonths, cardInvoiceSchedule, isoDate, monthLabelFromKey, parseMoney, shiftMonthKey } from "@/lib/finance";

export default function QuickEntry({onClose}:{onClose:()=>void}){
 const {profile,user}=useAuth(); const {cards,accounts}=useHouseholdData();
 const [type,setType]=useState<"expense"|"income"|"card"|"transfer">("expense");
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
 const [invoiceMonthOverride,setInvoiceMonthOverride]=useState("");
 const [reviewingCard,setReviewingCard]=useState(false);
 const [accountId,setAccountId]=useState("");
 const [fromAccountId,setFromAccountId]=useState("");
 const [toAccountId,setToAccountId]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");

 const selectedCard=useMemo(()=>cards.find(c=>c.id===cardId)||null,[cards,cardId]);
 const autoCardSchedule=useMemo(()=>selectedCard?cardInvoiceSchedule(selectedCard,date):null,[selectedCard,date]);
 const cardSchedule=useMemo(()=>selectedCard?cardInvoiceSchedule(selectedCard,date,invoiceMonthOverride||undefined):null,[selectedCard,date,invoiceMonthOverride]);
 const invoiceOptions=useMemo(()=>autoCardSchedule?[0,1,2].map(offset=>shiftMonthKey(autoCardSchedule.invoiceMonth,offset)):[],[autoCardSchedule]);

 useEffect(()=>{ if(execution==="actual" && !actualAmount) setActualAmount(amount); },[execution,amount,actualAmount]);
 useEffect(()=>{
  if(type==="transfer") setCategory("Transferência");
  else if(type==="income" && (category==="Casa"||category==="Transferência")) setCategory("Salário");
  else if((type==="expense"||type==="card") && category==="Transferência") setCategory("Casa");
 },[type,category]);
 useEffect(()=>{ if(type==="card"){setExecution("planned"); if(mode==="monthly") setMode("single");} },[type,mode]);
 useEffect(()=>{ if(type==="transfer"){setExecution("actual");setMode("single");} },[type]);
 useEffect(()=>{setReviewingCard(false);},[type,cardId,date,description,amount,mode,parts,category,invoiceMonthOverride]);

 async function save(e:React.FormEvent){
  e.preventDefault(); if(!profile?.householdId)return; setError("");
  const planned=parseMoney(amount); const actual=parseMoney(actualAmount || amount);
  if(planned<=0){setError("Informe um valor maior que zero.");return;}
  if(type==="transfer"){
   if(!fromAccountId||!toAccountId){setError("Selecione a conta de origem e a conta de destino.");return;}
   if(fromAccountId===toAccountId){setError("A conta de origem e destino precisam ser diferentes.");return;}
   setSaving(true);
   try{
    await createBankTransfer(profile.householdId,{fromAccountId,toAccountId,amount:planned,date,description,createdBy:user?.uid||""});
    onClose();
   }catch(err){setError(err instanceof Error?err.message:"Não foi possível realizar a transferência.");}
   finally{setSaving(false)}
   return;
  }
  if(type==="card" && !cardId){setError("Selecione o cartão utilizado.");return;}
  if(type==="card" && !cardSchedule){setError("Não foi possível calcular a fatura deste cartão.");return;}
  if(type==="card" && !reviewingCard){setReviewingCard(true);return;}
  if(execution==="actual" && type!=="card" && !accountId){setError("Selecione a conta bancária que recebeu ou pagou este lançamento.");return;}
  setSaving(true);
  try{
   if(type==="card" && cardSchedule){
    await createCardPurchase(profile.householdId,{
      cardId,
      description,
      totalAmount:planned,
      installments:mode==="installments"?Math.max(2,parts):1,
      purchaseDate:date,
      category,
      createdBy:user?.uid||"",
      firstInvoiceMonth:cardSchedule.invoiceMonth
    });
    onClose(); return;
   }
   const total=mode==="installments"?Math.max(2,parts):mode==="monthly"?24:1;
   const group=mode!=="single"?crypto.randomUUID():undefined;
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
      accountId:accountId||null,
      createdBy:user?.uid||""
    };
    if(realized) await createFinancialTransaction(profile.householdId,data);
    else await createItem(profile.householdId,"transactions",data);
   }
   onClose();
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar o lançamento.");}
  finally{setSaving(false)}
 }

 const cardMode=type==="card";
 const transferMode=type==="transfer";
 return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={save} onMouseDown={e=>e.stopPropagation()}>
  <div className="modal-head"><div><h2>{transferMode?"Transferência entre contas":"Novo lançamento"}</h2><p>{transferMode?"Movimente dinheiro entre contas do casal sem criar receita ou despesa.":cardMode?"Compras no cartão entram na fatura automaticamente.":"Planeje agora ou registre um valor já realizado."}</p></div><button type="button" onClick={onClose}><X/></button></div>
  <div className="segmented segmented-four">{[["expense","Despesa"],["income","Entrada"],["card","Cartão"],["transfer","Transferir"]].map(([v,l])=><button type="button" key={v} className={type===v?"selected":""} onClick={()=>setType(v as typeof type)}>{l}</button>)}</div>

  {transferMode?<>
    <div className="transfer-hero"><ArrowRightLeft/><div><strong>Transferência interna</strong><span>O valor sai de uma conta e entra na outra. O patrimônio total do casal não muda.</span></div></div>
    <label>Descrição (opcional)<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex.: PicPay para Itaú"/></label>
    <div className="form-grid"><label>Valor<input required inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0,00"/></label><label>Data da transferência<input type="date" required value={date} onChange={e=>{setDate(e.target.value);if(cardMode)setInvoiceMonthOverride("");}}/></label></div>
    <div className="form-grid"><label>Conta de origem<select required value={fromAccountId} onChange={e=>setFromAccountId(e.target.value)}><option value="">Selecione...</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.holder}</option>)}</select></label><label>Conta de destino<select required value={toAccountId} onChange={e=>setToAccountId(e.target.value)}><option value="">Selecione...</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.holder}</option>)}</select></label></div>
    {error&&<div className="error-box">{error}</div>}
    <button className="primary-btn wide" disabled={saving}>{saving?"Transferindo...":"Confirmar transferência"}</button>
  </>:<>
    {!cardMode&&<div className="execution-switch">
      <button type="button" className={execution==="planned"?"active":""} onClick={()=>setExecution("planned")}><Clock3/><span><strong>Provisionar</strong><small>Vai acontecer depois</small></span></button>
      <button type="button" className={execution==="actual"?"active actual":""} onClick={()=>setExecution("actual")}><CheckCircle2/><span><strong>Já realizado</strong><small>Entrou ou saiu da conta</small></span></button>
    </div>}
    {cardMode&&<div className="notice">A compra será detalhada dentro do cartão. Em Movimentações aparecerá somente a fatura consolidada, evitando duplicidade.</div>}
    <label>Descrição<input required value={description} onChange={e=>setDescription(e.target.value)} placeholder={type==="income"?"Ex.: Salário - André":cardMode?"Ex.: Combustível, mercado, tênis...":"Ex.: Financiamento do carro"}/></label>
    <div className="form-grid"><label>{cardMode?"Valor total da compra":"Valor previsto"}<input required inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0,00"/></label><label>{cardMode?"Data da compra":"Vencimento / previsão"}<input type="date" required value={date} onChange={e=>{setDate(e.target.value);if(cardMode)setInvoiceMonthOverride("");}}/></label></div>
    {execution==="actual"&&!cardMode&&<div className="realized-box"><div className="form-grid"><label>Valor realizado<input required inputMode="decimal" value={actualAmount} onChange={e=>setActualAmount(e.target.value)} placeholder={amount||"0,00"}/></label><label>Data do {type==="income"?"recebimento":"pagamento"}<input type="date" required value={actualDate} onChange={e=>setActualDate(e.target.value)}/></label></div><p>O valor realizado alimenta o Dashboard e atualiza automaticamente o saldo da conta escolhida.</p></div>}
    <label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}>{["Casa","Mercado","Veículo","Saúde","Lazer","Educação","Assinaturas","Salário","Investimentos","Compras","Outros"].map(x=><option key={x}>{x}</option>)}</select></label>
    {cardMode?<><label>Cartão<select required value={cardId} onChange={e=>{setCardId(e.target.value);setInvoiceMonthOverride("");}}><option value="">Selecione...</option>{cards.map(c=><option key={c.id} value={c.id}>{c.name} · {c.holder}</option>)}</select></label>{cardSchedule&&<><div className="card-invoice-preview compact"><div><span>Fatura calculada</span><strong>{cardSchedule.invoiceLabel}</strong><small>Vencimento {new Date(`${cardSchedule.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</small></div><div><span>Fechamento</span><strong>{new Date(`${cardSchedule.closingDate}T12:00:00`).toLocaleDateString("pt-BR")}</strong><small>{selectedCard?.name}</small></div></div><label>Fatura da 1ª parcela<select value={invoiceMonthOverride||autoCardSchedule?.invoiceMonth||""} onChange={e=>setInvoiceMonthOverride(e.target.value)}>{invoiceOptions.map(key=><option key={key} value={key}>{monthLabelFromKey(key)}</option>)}</select><small className="field-help">A sugestão considera fechamento e vencimento. Se o banco mostrar outro mês, ajuste aqui antes de confirmar.</small></label>{cardSchedule.onClosingDay&&!invoiceMonthOverride&&<div className="warning-box">Compra no dia do fechamento: confirme a fatura no aplicativo do cartão, pois o horário de processamento pode mudar o mês.</div>}</>}</>:<label>Conta bancária {execution==="actual"?"(obrigatória)":"(opcional)"}<select required={execution==="actual"} value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">{execution==="actual"?"Selecione a conta...":"Não informar"}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.holder}</option>)}</select></label>}
    <label>{cardMode?"Parcelamento":"Repetição"}<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}>{cardMode?<><option value="single">À vista no cartão — 1x</option><option value="installments">Compra parcelada</option></>:<><option value="single">Somente este lançamento</option><option value="monthly">Recorrente mensal — provisionar 24 meses</option><option value="installments">Compra/conta parcelada</option></>}</select></label>
    {mode==="installments"&&<label>Número de parcelas<input type="number" min="2" max="120" value={parts} onChange={e=>setParts(Number(e.target.value))}/></label>}
    {execution==="actual"&&mode!=="single"&&!cardMode&&<div className="notice">Somente a primeira parcela/ocorrência será marcada como realizada. As próximas continuarão provisionadas automaticamente.</div>}
    {cardMode&&reviewingCard&&cardSchedule&&<div className="invoice-confirm-box"><CheckCircle2/><div><strong>Confirme a fatura</strong><p>Este lançamento entrará na fatura de <b>{cardSchedule.invoiceLabel}</b>, com vencimento em <b>{new Date(`${cardSchedule.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</b>.</p></div></div>}
    {error&&<div className="error-box">{error}</div>}
    <button className="primary-btn wide" disabled={saving}>{saving?"Salvando...":cardMode?(reviewingCard&&cardSchedule?`Confirmar na fatura de ${cardSchedule.invoiceLabel}`:"Revisar fatura antes de salvar"):execution==="actual"?"Salvar e atualizar saldo":"Salvar provisionamento"}</button>
  </>}
 </form></div>
}
