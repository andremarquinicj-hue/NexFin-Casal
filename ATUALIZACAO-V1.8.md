# NexFin v1.8 — edição do cartão + próximas faturas detalhadas

## Novidades

### 1. Editar configurações do cartão
Cada cartão agora possui o botão **Editar cartão**. É possível alterar:

- limite total;
- dia de fechamento;
- dia de vencimento da fatura.

Ao alterar o vencimento, as faturas abertas já provisionadas têm a data de vencimento atualizada automaticamente. O novo fechamento passa a valer para novos lançamentos, sem mover compras antigas de uma fatura já definida para outra.

### 2. Visualizar despesas dos próximos meses
Cada cartão agora possui o botão **Próximas faturas**.

A tela mostra até 12 faturas futuras já provisionadas, com:

- mês da fatura;
- total previsto;
- data de vencimento;
- descrição de cada compra;
- categoria;
- número da parcela;
- valor da parcela.

Também há o botão **Abrir fatura**, que leva diretamente aquele mês para a visualização detalhada da aba Cartões.

## Compatibilidade

Não é necessário recriar o Firebase nem alterar as regras do Firestore. Os cartões e lançamentos existentes continuam sendo utilizados.
