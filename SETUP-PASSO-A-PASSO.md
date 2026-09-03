# Atualização rápida — NexFin v1.2

## 1. GitHub

Substitua o conteúdo do repositório pela pasta desta versão e faça o commit:

```bash
git add .
git commit -m "NexFin v1.2 - logo e icone do app"
git push
```

Se você atualiza pelo site do GitHub, pode também enviar os arquivos mantendo exatamente as mesmas pastas.

## 2. Vercel

Como a Vercel já está ligada ao GitHub, o `push` deve iniciar um deploy automaticamente. Aguarde ficar **Ready**.

A configuração atual do Firebase está diretamente em `lib/firebase.ts`; portanto, esta versão não depende das variáveis `NEXT_PUBLIC_FIREBASE_*` para iniciar o Firebase.

## 3. Conferir a nova logo

Após o deploy:

1. Abra o NexFin.
2. Faça `Ctrl + F5` no computador para limpar o cache visual.
3. Confira o símbolo novo no login e no topo do menu lateral.
4. Confira também o favicon da aba do navegador.

## 4. Salvar no celular com a nova logo

### iPhone
Safari → Compartilhar → **Adicionar à Tela de Início** → Adicionar.

### Android
Chrome → menu ⋮ → **Adicionar à tela inicial** ou **Instalar app**.

O NexFin está configurado com:

- ícone 192×192
- ícone 512×512
- ícone maskable 512×512
- Apple Touch Icon 180×180
- `manifest.webmanifest` com nome NexFin e modo `standalone`

> Se você já tinha um atalho antigo na tela inicial, apague o atalho antigo e adicione novamente após o deploy para forçar o celular a usar a nova logo.
