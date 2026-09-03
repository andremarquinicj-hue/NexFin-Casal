import { Inbox } from "lucide-react";
export default function Empty({text="Nenhum lançamento por aqui ainda."}:{text?:string}){return <div className="empty"><Inbox/><strong>{text}</strong><span>Use “Novo lançamento” para começar.</span></div>}
