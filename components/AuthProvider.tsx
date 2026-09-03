"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseServices, firebaseConfigured } from "@/lib/firebase";
import { AppUser } from "@/lib/types";

type Ctx={user:User|null; profile:AppUser|null; loading:boolean; firebaseConfigured:boolean; signOut:()=>Promise<void>};
const AuthContext=createContext<Ctx>({user:null,profile:null,loading:true,firebaseConfigured,signOut:async()=>{}});
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [profile,setProfile]=useState<AppUser|null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{ const s=getFirebaseServices(); if(!s){setLoading(false);return;} return onAuthStateChanged(s.auth,async u=>{setUser(u);setProfile(null); if(u){const snap=await getDoc(doc(s.db,"users",u.uid)); if(snap.exists()) setProfile({uid:u.uid,...snap.data()} as AppUser);} setLoading(false);});},[]);
 return <AuthContext.Provider value={{user,profile,loading,firebaseConfigured,signOut:async()=>{const s=getFirebaseServices();if(s)await fbSignOut(s.auth)}}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
