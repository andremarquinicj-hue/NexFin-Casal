# NexFin v1.4.1 — Correção de duplicidade de cartão

Esta versão corrige a duplicidade entre compras individuais do cartão e a fatura consolidada.

## Regra financeira correta

- **Cartões:** exibem cada compra individual e suas parcelas.
- **Movimentações:** exibem somente a fatura consolidada do cartão.
- **Dashboard / planejamento / saldo projetado:** consideram somente a fatura consolidada como saída de caixa.
- **Análise por categoria / economia:** usa os itens individuais do cartão e exclui a fatura consolidada para preservar o detalhamento sem duplicar valores.

## Novo lançamento rápido

O tipo **Cartão** no botão Novo lançamento agora usa a mesma lógica da aba Cartões:
- valor informado = valor total da compra;
- informa 1x ou número de parcelas;
- gera parcelas futuras;
- atualiza a fatura automaticamente;
- não afeta conta bancária até o pagamento da fatura.
