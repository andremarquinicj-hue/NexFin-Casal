import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseServices } from "./firebase";

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
