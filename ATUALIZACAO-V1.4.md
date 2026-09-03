# NexFin v1.4 — Compras por cartão + fatura automática

## O que entrou nesta versão

- Cadastro de compras dentro de cada cartão.
- Campo para informar **descrição da compra**, **valor total**, **quantidade de parcelas**, **data da compra** e **categoria**.
- Geração automática das parcelas futuras da compra.
- Geração automática da **fatura do cartão** em **Movimentações** para cada mês correspondente.
- Visualização, na própria aba **Cartões**, dos itens que compõem a fatura do mês.
- Resumo de **compras parceladas ativas** por cartão.

## Como funciona

Ao cadastrar uma compra no cartão, o NexFin:

1. identifica o cartão usado;
2. calcula em qual fatura a compra entra com base na **data da compra** e no **dia de fechamento** do cartão;
3. cria as parcelas futuras como lançamentos do tipo **card**;
4. soma as parcelas do mês e cria/atualiza automaticamente a **fatura do cartão** em **Movimentações**.

Assim, você consegue:

- ver cada gasto que formou a fatura;
- acompanhar as parcelas futuras;
- pagar a fatura em **Movimentações** e dar baixa normalmente pela conta bancária.
