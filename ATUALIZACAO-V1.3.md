# NexFin v1.3 — Realizado + saldo automático + dashboard preditivo

Esta atualização mantém a configuração atual de Firebase, logo/PWA e dados existentes.

## O que mudou

### Movimentações
- Seletor de mês.
- Cards de previsto x realizado.
- Botão de confirmar recebimento/pagamento em cada lançamento pendente.
- Modal com **valor realizado**, **data** e **conta bancária**.
- Ao confirmar uma entrada, o valor é somado ao saldo da conta.
- Ao confirmar uma despesa, o valor é descontado do saldo da conta.
- Exclusão de um lançamento realizado criado nesta versão estorna o impacto da conta antes de excluir.

### Novo lançamento
- Nova escolha: **Provisionar** ou **Já realizado**.
- Em "Já realizado", informe valor real, data e conta.
- Em recorrências/parcelamentos, somente a primeira ocorrência é realizada; as futuras continuam provisionadas.

### Contas bancárias
- Saldo consolidado.
- Entradas realizadas no mês.
- Saídas realizadas no mês.
- Cada conta mostra seu fluxo mensal de entradas e saídas.

### Dashboard
- Saldo consolidado das contas.
- Saldo livre projetado: saldo atual + entradas pendentes - contas a pagar.
- Fluxo projetado dos próximos 6 meses.
- Projeção automática do próximo mês baseada em salários, recorrências e parcelas já provisionadas.
- Percentual de comprometimento da renda no próximo mês.
- Principais compromissos do próximo mês.

## Atualização

Substitua o conteúdo do repositório pelos arquivos desta versão e faça commit na branch conectada à Vercel. Não é necessário recriar o Firebase nem apagar os dados atuais.
