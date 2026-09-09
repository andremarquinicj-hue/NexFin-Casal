# NexFin v1.7.1 — limite e faturas futuras do cartão

Correção para compras lançadas em uma fatura futura (ex.: compra feita em setembro que só vence em outubro).

## O que foi corrigido

- O limite disponível agora considera **todas as parcelas ainda não quitadas**, inclusive as que estão em faturas futuras.
- Quando uma fatura é paga, as parcelas daquela fatura deixam de comprometer o limite no cálculo do NexFin.
- A aba Cartões ganhou navegação por mês para visualizar setembro, outubro, novembro etc.
- Cada cartão mostra o valor da fatura do mês selecionado, o limite comprometido total e a próxima fatura em aberto.
- Compras lançadas para outubro passam a aparecer ao navegar para outubro, sem alterar o vencimento correto gravado na v1.7.

Nenhuma regra do Firebase precisa ser alterada.
