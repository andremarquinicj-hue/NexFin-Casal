# NexFin v1.8.2 — correção de build da Vercel

- Corrigido erro TypeScript TS2339 em `lib/firestore.ts`.
- Mantida a liberação automática do limite do cartão ao pagar uma fatura.
- A função de baixa agora recebe corretamente os dados da fatura paga como retorno da transação do Firestore, evitando inferência `never` pelo TypeScript.
