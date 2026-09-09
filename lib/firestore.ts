import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseServices } from "./firebase";
import { Transaction, Card } from "./types";
import { addMonths, monthLabelFromKey, monthKey, parseMoney, shiftMonthKey } from "./finance";

export function listenCollection<T>(householdId: string, name: string, cb: (items:T[])=>void) {
  const s = getFirebaseServices(); if (!s || !householdId) return () => {};
  const q = query(collection(s.db,"households",householdId,name), orderBy("createdAt","desc"));
  return onSnapshot(q, snap => cb(snap.docs.map(d=>({id:d.id,...d.data()}) as T)), err => { console.error(err); cb([]); });
}
export async function createItem(householdId:string, name:string, data:Record<string,unknown>) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  return addDoc(collection(s.db,"households",householdId,name), {...data,createdAt:serverTimestamp()});
}
export async function updateItem(householdId:string,name:string,id:string,data:Record<string,unknown>) { const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado"); return updateDoc(doc(s.db,"households",householdId,name,id),data); }
export async function removeItem(householdId:string,name:string,id:string) { const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado"); return deleteDoc(doc(s.db,"households",householdId,name,id)); }
export async function setHouseholdItem(householdId:string,name:string,id:string,data:Record<string,unknown>) { const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado"); return setDoc(doc(s.db,"households",householdId,name,id),data,{merge:true}); }

export async function createFinancialTransaction(householdId:string, data:Record<string,unknown>) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const txRef = doc(collection(s.db,"households",householdId,"transactions"));
  const type = String(data.type || "expense") as Transaction["type"];
  const status = String(data.status || "planned") as Transaction["status"];
  const accountId = typeof data.accountId === "string" ? data.accountId : "";
  const amountActual = Number(data.amountActual ?? data.amountPlanned ?? 0);
  const realized = status === "received" || status === "paid";

  if (!realized || !accountId || type === "card") {
    await setDoc(txRef, {...data, createdAt:serverTimestamp()});
    return txRef;
  }

  const accountRef = doc(s.db,"households",householdId,"accounts",accountId);
  await runTransaction(s.db, async tr => {
    const accountSnap = await tr.get(accountRef);
    if (!accountSnap.exists()) throw new Error("Conta bancária não encontrada.");
    const currentBalance = Number(accountSnap.data().balance || 0);
    const delta = type === "income" ? amountActual : -amountActual;
    tr.set(txRef, {...data, createdAt:serverTimestamp(), accountImpactApplied:true});
    tr.update(accountRef, {balance: currentBalance + delta, updatedAt:serverTimestamp()});
  });
  return txRef;
}


export async function createBankTransfer(
  householdId:string,
  payload:{fromAccountId:string;toAccountId:string;amount:number|string;date:string;description?:string;createdBy:string}
) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const amount=parseMoney(payload.amount);
  if(amount<=0) throw new Error("Informe um valor maior que zero.");
  if(!payload.fromAccountId || !payload.toAccountId) throw new Error("Selecione a conta de origem e a conta de destino.");
  if(payload.fromAccountId===payload.toAccountId) throw new Error("A conta de origem e destino precisam ser diferentes.");

  const fromRef=doc(s.db,"households",householdId,"accounts",payload.fromAccountId);
  const toRef=doc(s.db,"households",householdId,"accounts",payload.toAccountId);
  const txRef=doc(collection(s.db,"households",householdId,"transactions"));

  await runTransaction(s.db, async tr=>{
    const fromSnap=await tr.get(fromRef);
    const toSnap=await tr.get(toRef);
    if(!fromSnap.exists() || !toSnap.exists()) throw new Error("Uma das contas selecionadas não foi encontrada.");
    const fromData=fromSnap.data();
    const toData=toSnap.data();
    const fromBalance=Number(fromData.balance||0);
    const toBalance=Number(toData.balance||0);
    const fromName=String(fromData.name||fromData.bank||"Conta de origem");
    const toName=String(toData.name||toData.bank||"Conta de destino");

    tr.update(fromRef,{balance:fromBalance-amount,updatedAt:serverTimestamp()});
    tr.update(toRef,{balance:toBalance+amount,updatedAt:serverTimestamp()});
    tr.set(txRef,{
      description:payload.description?.trim() || `Transferência ${fromName} → ${toName}`,
      amountPlanned:amount,
      amountActual:amount,
      type:"transfer",
      status:"paid",
      category:"Transferência",
      dueDate:payload.date,
      paidDate:payload.date,
      accountId:payload.fromAccountId,
      fromAccountId:payload.fromAccountId,
      toAccountId:payload.toAccountId,
      fromAccountName:fromName,
      toAccountName:toName,
      createdBy:payload.createdBy,
      accountImpactApplied:true,
      createdAt:serverTimestamp(),
      settledAt:serverTimestamp()
    });
  });
  return txRef;
}

export async function settleFinancialTransaction(householdId:string, transactionId:string, payload:{actualAmount:number; actualDate:string; accountId?:string}) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const txRef = doc(s.db,"households",householdId,"transactions",transactionId);
  await runTransaction(s.db, async tr => {
    const txSnap = await tr.get(txRef);
    if (!txSnap.exists()) throw new Error("Lançamento não encontrado.");
    const tx = txSnap.data() as Transaction;
    if (tx.status === "paid" || tx.status === "received") throw new Error("Este lançamento já foi realizado.");
    if (tx.status === "cancelled") throw new Error("Lançamento cancelado não pode ser realizado.");

    const type = tx.type;
    const isBankMovement = type === "income" || type === "expense";
    const accountId = payload.accountId || tx.accountId || "";
    if (isBankMovement && !accountId) throw new Error("Selecione a conta bancária usada no pagamento ou recebimento.");

    if (isBankMovement) {
      const accountRef = doc(s.db,"households",householdId,"accounts",accountId);
      const accountSnap = await tr.get(accountRef);
      if (!accountSnap.exists()) throw new Error("Conta bancária não encontrada.");
      const currentBalance = Number(accountSnap.data().balance || 0);
      const delta = type === "income" ? payload.actualAmount : -payload.actualAmount;
      tr.update(accountRef, {balance: currentBalance + delta, updatedAt:serverTimestamp()});
    }

    tr.update(txRef, {
      status: type === "income" ? "received" : "paid",
      amountActual: payload.actualAmount,
      paidDate: payload.actualDate,
      accountId: isBankMovement ? accountId : (tx.accountId || null),
      accountImpactApplied: isBankMovement,
      settledAt: serverTimestamp()
    });
  });
}

export async function removeFinancialTransaction(householdId:string, transactionId:string) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const txRef = doc(s.db,"households",householdId,"transactions",transactionId);
  const txSnap = await getDoc(txRef);
  if (!txSnap.exists()) return;
  const tx = txSnap.data() as Transaction & {accountImpactApplied?:boolean};

  await runTransaction(s.db, async tr => {
    const fresh = await tr.get(txRef);
    if (!fresh.exists()) return;
    const current = fresh.data() as Transaction & {accountImpactApplied?:boolean};
    const realized = current.status === "received" || current.status === "paid";
    const bankMovement = current.type === "income" || current.type === "expense";
    if (realized && bankMovement && current.accountId && current.accountImpactApplied === true) {
      const accountRef = doc(s.db,"households",householdId,"accounts",current.accountId);
      const accountSnap = await tr.get(accountRef);
      if (accountSnap.exists()) {
        const currentBalance = Number(accountSnap.data().balance || 0);
        const amount = Number(current.amountActual ?? current.amountPlanned ?? 0);
        const reversal = current.type === "income" ? -amount : amount;
        tr.update(accountRef,{balance:currentBalance+reversal,updatedAt:serverTimestamp()});
      }
    }
    if (current.type === "transfer" && current.accountImpactApplied === true && current.fromAccountId && current.toAccountId) {
      const fromRef=doc(s.db,"households",householdId,"accounts",current.fromAccountId);
      const toRef=doc(s.db,"households",householdId,"accounts",current.toAccountId);
      const fromSnap=await tr.get(fromRef);
      const toSnap=await tr.get(toRef);
      const amount=Number(current.amountActual ?? current.amountPlanned ?? 0);
      if(fromSnap.exists()) tr.update(fromRef,{balance:Number(fromSnap.data().balance||0)+amount,updatedAt:serverTimestamp()});
      if(toSnap.exists()) tr.update(toRef,{balance:Number(toSnap.data().balance||0)-amount,updatedAt:serverTimestamp()});
    }
    tr.delete(txRef);
  });

  if (tx.type === "card" && tx.sourceCardId && tx.invoiceMonth) {
    await syncCardInvoiceForMonth(householdId, tx.sourceCardId, tx.invoiceMonth);
  }
}

export async function getHouseholdDocument(householdId:string, name:string, id:string) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  return getDoc(doc(s.db,"households",householdId,name,id));
}

function pad2(value:number){ return String(Math.max(1, Math.min(28, value))).padStart(2, "0"); }

function splitInstallments(total:number, installments:number){
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / installments);
  const remainder = cents - base * installments;
  return Array.from({length:installments}, (_,i)=>(base + (i === installments - 1 ? remainder : 0)) / 100);
}

async function getCard(householdId:string, cardId:string){
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const snap = await getDoc(doc(s.db, "households", householdId, "cards", cardId));
  if (!snap.exists()) throw new Error("Cartão não encontrado.");
  return { id: snap.id, ...snap.data() } as Card;
}

function getInvoiceMonthForPurchase(purchaseDate:string, closingDay:number){
  let invoiceMonth = monthKey(new Date(`${purchaseDate}T12:00:00`));
  const purchaseDay = Number(purchaseDate.split("-")[2] || 1);
  if (purchaseDay > closingDay) invoiceMonth = shiftMonthKey(invoiceMonth, 1);
  return invoiceMonth;
}

export async function createCardPurchase(
  householdId:string,
  payload:{cardId:string;description:string;totalAmount:number|string;installments:number|string;purchaseDate:string;category:string;createdBy:string;notes?:string}
){
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const card = await getCard(householdId, payload.cardId);
  const totalAmount = parseMoney(payload.totalAmount);
  const installments = Math.max(1, Math.round(Number(payload.installments || 1)));
  if (totalAmount <= 0) throw new Error("Informe o valor total da compra.");
  const groupId = `${payload.cardId}-${Date.now()}`;
  const firstInvoiceMonth = getInvoiceMonthForPurchase(payload.purchaseDate, Number(card.closingDay || 28));
  const amounts = splitInstallments(totalAmount, installments);
  const batch = writeBatch(s.db);

  amounts.forEach((amount, index) => {
    const invoiceMonth = shiftMonthKey(firstInvoiceMonth, index);
    const dueDate = `${invoiceMonth}-${pad2(Number(card.dueDay || 7))}`;
    const ref = doc(collection(s.db, "households", householdId, "transactions"));
    batch.set(ref, {
      description: payload.description,
      amountPlanned: amount,
      type: "card",
      status: "planned",
      category: payload.category || "Cartão",
      dueDate,
      paidDate: null,
      accountId: null,
      cardId: payload.cardId,
      sourceCardId: payload.cardId,
      invoiceMonth,
      installmentGroupId: groupId,
      installmentNumber: index + 1,
      installmentTotal: installments,
      notes: payload.notes || "",
      createdBy: payload.createdBy,
      autoGenerated: false,
      isCardInvoice: false,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();

  const months = Array.from(new Set(amounts.map((_, index) => shiftMonthKey(firstInvoiceMonth, index))));
  for (const invoiceMonth of months) {
    await syncCardInvoiceForMonth(householdId, payload.cardId, invoiceMonth);
  }

  return { firstInvoiceMonth, installments, groupId };
}

export async function syncCardInvoiceForMonth(householdId:string, cardId:string, invoiceMonth:string) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const card = await getCard(householdId, cardId);

  const purchasesQuery = query(
    collection(s.db, "households", householdId, "transactions"),
    where("type", "==", "card"),
    where("sourceCardId", "==", cardId),
    where("invoiceMonth", "==", invoiceMonth)
  );
  const purchasesSnap = await getDocs(purchasesQuery);
  const purchaseDocs = purchasesSnap.docs.filter(d => {
    const data = d.data();
    return data.status !== "cancelled" && data.isCardInvoice !== true;
  });
  const total = purchaseDocs.reduce((sum, d) => sum + Number(d.data().amountPlanned || 0), 0);

  const invoicesQuery = query(
    collection(s.db, "households", householdId, "transactions"),
    where("type", "==", "expense"),
    where("sourceCardId", "==", cardId),
    where("invoiceMonth", "==", invoiceMonth),
    where("isCardInvoice", "==", true)
  );
  const invoiceSnap = await getDocs(invoicesQuery);
  const existing = invoiceSnap.docs[0];

  if (total <= 0) {
    if (existing) await deleteDoc(existing.ref);
    return;
  }

  const dueDate = `${invoiceMonth}-${pad2(Number(card.dueDay || 7))}`;
  const description = `Fatura ${card.name} · ${monthLabelFromKey(invoiceMonth)}`;
  const payload = {
    description,
    amountPlanned: Number(total.toFixed(2)),
    type: "expense",
    status: "planned",
    category: "Cartão de crédito",
    dueDate,
    paidDate: null,
    accountId: null,
    cardId,
    sourceCardId: cardId,
    invoiceMonth,
    createdBy: "system",
    autoGenerated: true,
    isCardInvoice: true,
    createdAt: serverTimestamp(),
  };

  if (!existing) {
    await addDoc(collection(s.db, "households", householdId, "transactions"), payload);
  } else {
    const current = existing.data() as Transaction;
    if (current.status === "paid") return;
    await updateDoc(existing.ref, {
      description,
      amountPlanned: Number(total.toFixed(2)),
      dueDate,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function saveMonthlyClosing(
  householdId:string,
  month:string,
  data:Record<string,unknown>
) {
  const s=getFirebaseServices(); if(!s) throw new Error("Firebase não configurado");
  const ref=doc(s.db,"households",householdId,"monthlyClosings",month);
  const snap=await getDoc(ref);
  await setDoc(ref,{
    ...data,
    month,
    createdAt:snap.exists() ? (snap.data().createdAt || serverTimestamp()) : serverTimestamp(),
    updatedAt:serverTimestamp()
  },{merge:true});
  return ref;
}
