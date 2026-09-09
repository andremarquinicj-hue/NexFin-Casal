# NexFin v1.6 — Transferências, baixa rápida e busca

Esta versão adiciona três melhorias de uso diário.

## 1. Transferência entre contas cadastradas

No botão **Novo lançamento**, existe agora a opção **Transferir**.

Você informa:

- conta de origem;
- conta de destino;
- valor;
- data;
- descrição opcional.

Ao confirmar, o NexFin desconta o valor da conta de origem e soma na conta de destino em uma única operação. A transferência fica registrada em **Movimentações**, mas **não é contabilizada como receita nem como despesa**, porque o dinheiro continua pertencendo ao casal.

Se uma transferência for excluída, os dois saldos são estornados automaticamente.

## 2. Dar baixa direto no cronograma

Na **Visão geral > Próximos compromissos**, os lançamentos pendentes agora possuem botão **Pagar** ou **Receber**.

O mesmo recurso também está disponível no **Calendário financeiro** ao selecionar um dia.

Ao clicar, abre a mesma janela de realizado usada em Movimentações, permitindo informar:

- valor realmente pago/recebido;
- data;
- conta bancária utilizada.

O saldo da conta e o Dashboard são atualizados automaticamente.

## 3. Busca nas Movimentações

A aba **Movimentações** agora possui uma barra de pesquisa.

É possível buscar por:

- nome/descrição;
- categoria;
- nome das contas de uma transferência;
- valor, por exemplo `507,35`, `507.35` ou `507`.

A busca respeita o mês selecionado e os filtros de Entradas, Despesas, Faturas e Transferências.

## Firebase

Não é necessário alterar as regras do Firestore para esta versão. As transferências são gravadas na coleção de transações já existente.
