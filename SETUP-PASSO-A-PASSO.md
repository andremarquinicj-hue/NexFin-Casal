# Instalação rápida — NexFin Casal

## Firebase
1. Crie um projeto em console.firebase.google.com.
2. Em **Authentication > Sign-in method**, habilite **E-mail/senha**.
3. Em **Firestore Database**, crie o banco.
4. Em **Configurações do projeto > Seus apps**, crie um app Web e copie a configuração.
5. Renomeie `.env.local.example` para `.env.local` e preencha as seis variáveis.
6. Rode `firebase deploy --only firestore:rules,firestore:indexes` para publicar as regras.

## GitHub
1. Crie um repositório vazio.
2. Dentro da pasta do projeto rode:
   `git init`
   `git add .`
   `git commit -m "NexFin inicial"`
   `git branch -M main`
   `git remote add origin URL_DO_REPOSITORIO`
   `git push -u origin main`

## Vercel
1. Clique em **Add New > Project**.
2. Importe o repositório do GitHub.
3. Cadastre as mesmas seis variáveis `NEXT_PUBLIC_FIREBASE_*` em **Environment Variables**.
4. Clique em **Deploy**.
5. Se o Firebase solicitar, adicione o domínio principal `seu-projeto.vercel.app` em **Authentication > Settings > Authorized domains**.

## Primeiro uso
1. Abra o site e clique em **Primeiro acesso? Criar conta**.
2. Crie a família financeira.
3. Entre em **Configurações** e copie o **ID da família** e o **código de convite**.
4. No celular da outra pessoa, crie outra conta escolhendo **Entrar com convite**.
5. Cadastre contas bancárias, cartões e depois os salários/contas no botão **Novo lançamento**.
6. Para salário nos dias 5 e 20, crie dois lançamentos de entrada e escolha **Recorrente mensal**.
