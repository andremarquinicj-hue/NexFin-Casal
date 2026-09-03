# NexFin Casal — v1.2

Aplicativo web/PWA para controle financeiro compartilhado de um casal, construído com Next.js + Firebase.

## O que já vem nesta versão

- Login/cadastro com Firebase Authentication
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
- **Nova identidade visual NexFin integrada ao sistema**
- **Ícone próprio para iPhone/Android ao adicionar o NexFin à tela inicial**
- Favicon e metadados PWA configurados

## Identidade visual

Os arquivos principais estão em:

- `public/brand/nexfin-logo.png` — logo completa
- `public/brand/nexfin-symbol.png` — símbolo usado dentro do sistema
- `public/icons/` — ícones do navegador e da tela inicial do celular
- `app/icon.png` e `app/apple-icon.png` — ícones reconhecidos pelo Next.js/iOS

## Firebase

Esta cópia já está configurada em `lib/firebase.ts` com o projeto Firebase usado no NexFin atual. Portanto, para o deploy atual, **não é necessário configurar as variáveis `NEXT_PUBLIC_FIREBASE_*` na Vercel**.

Ainda é necessário manter no Firebase:

1. **Authentication > Sign-in method > E-mail/senha** ativado.
2. **Cloud Firestore** criado.
3. As regras de `firestore.rules` publicadas.
4. O domínio da Vercel autorizado em **Authentication > Settings > Authorized domains**, se necessário.

Para publicar as regras via Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

## Rodar localmente

```bash
npm install
npm run dev
```

## GitHub e Vercel

Substitua os arquivos do repositório pela versão v1.2, faça commit e push. A Vercel conectada ao GitHub fará um novo deploy automaticamente.

```bash
git add .
git commit -m "NexFin v1.2 - nova logo e icones PWA"
git push
```

## Uso no celular

Depois que a nova versão estiver publicada:

- **iPhone/Safari:** Compartilhar → Adicionar à Tela de Início.
- **Android/Chrome:** menu ⋮ → Adicionar à tela inicial / Instalar app.

O atalho utilizará o novo ícone NexFin e abrirá o sistema com aparência de aplicativo (`display: standalone`).

## Acesso do casal

Se vocês preferirem usar **o mesmo e-mail e a mesma senha**, basta entrar com a mesma conta nos dois celulares. Os dados serão os mesmos. O fluxo de convite continua disponível no código caso vocês queiram voltar a usar contas individuais no futuro.

## Novidades da versão 1.3

- Registro de **valor realizado** com data e conta bancária no momento do pagamento/recebimento.
- Atualização automática do **saldo da conta bancária** quando uma entrada ou despesa é realizada.
- Lançamento rápido agora permite escolher entre **Provisionar** e **Já realizado**.
- Movimentações com seletor mensal, resumo previsto x realizado e modal profissional de confirmação.
- Dashboard renovado com **saldo consolidado**, **saldo livre projetado**, fluxo financeiro de 6 meses e **projeção automática do próximo mês** baseada nas recorrências, parcelas e receitas já provisionadas.
