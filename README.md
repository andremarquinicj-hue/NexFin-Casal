# NexFin Casal

Aplicativo web/PWA para controle financeiro compartilhado de um casal, construído com Next.js + Firebase.

## O que já vem nesta versão

- Login/cadastro com Firebase Authentication
- Família financeira compartilhada e isolamento de dados por regras do Firestore
- Dashboard mensal com previsto x realizado
- Entradas, despesas e compras no cartão
- Parcelamentos automáticos
- Recorrências mensais provisionadas automaticamente por 24 meses
- Contas bancárias e saldo consolidado
- Cartões, limite e fatura prevista
- Planejamento dos próximos 12 meses
- Caixinhas para viagem, bens, reserva e outros objetivos
- Dicas de economia por categoria
- Simulador de poupança para 6 meses, 1, 2 e 5 anos
- Interface responsiva para celular e computador

## 1. Criar o Firebase

No Firebase Console:

1. Crie um projeto.
2. Ative Authentication > Sign-in method > Email/Password.
3. Crie o Cloud Firestore.
4. Em Project Settings > Your apps, adicione um app Web.
5. Copie as variáveis para `.env.local`, usando `.env.example` como modelo.
6. Instale o Firebase CLI e publique as regras:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

## 2. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## 3. Subir no GitHub

```bash
git init
git add .
git commit -m "Primeira versão NexFin Casal"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## 4. Publicar na Vercel

1. Importe o repositório do GitHub na Vercel.
2. Em Project Settings > Environment Variables, cadastre todas as variáveis `NEXT_PUBLIC_FIREBASE_*` do `.env.local`.
3. Faça o Deploy.

## Acesso do casal

O primeiro usuário cria a família. Em **Configurações**, copie o ID da família e o código de convite. No segundo celular, o parceiro escolhe **Criar conta > Entrar com convite** e usa seu próprio e-mail e senha.

## Próximas evoluções recomendadas

Fechamento formal de faturas, conciliação automática de saldo bancário, notificações de vencimento, edição em lote de recorrências e exportação de relatórios em PDF/Excel.
