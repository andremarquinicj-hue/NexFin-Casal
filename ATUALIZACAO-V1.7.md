# NexFin v1.7 — cálculo correto de fatura por fechamento

## Correção principal

O lançamento no cartão agora considera corretamente:

- data da compra;
- dia de fechamento do cartão;
- dia de vencimento;
- relação entre o fechamento e o mês de vencimento.

Exemplo: cartão que vence dia 08 e fecha dia 28. Uma compra feita em 09/09 não entra na fatura de setembro, porque a fatura de setembro fechou em 28/08. Ela é lançada na fatura de outubro, com vencimento em 08/10.

## Confirmação antes de salvar

Ao lançar uma compra, o NexFin mostra antes de gravar:

- mês da fatura calculada;
- data de fechamento daquela fatura;
- data de vencimento;
- valor estimado da parcela.

O usuário precisa revisar e confirmar o lançamento.

Também é possível alterar manualmente a fatura sugerida antes de confirmar, caso o aplicativo do banco informe outro mês.

## Compras no dia do fechamento

Se a compra for lançada exatamente no dia do fechamento, o NexFin exibe um aviso para confirmar no aplicativo do cartão, pois a operadora pode processar a compra na fatura atual ou na seguinte dependendo do horário.

## Correção de compras já lançadas incorretamente

Na tabela da fatura foi adicionado um botão para excluir uma compra parcelada inteira. Ao excluir, o NexFin remove todas as parcelas daquela compra e recalcula automaticamente as faturas afetadas.
