# NexFin v1.8.4 — Correção definitiva do limite comprometido

## Correção
O limite disponível do cartão agora é calculado por fatura/mês, usando todas as faturas ainda em aberto.

Para cada mês, o NexFin utiliza apenas um valor de compromisso (sem duplicar):
- fatura consolidada em aberto; ou
- soma das compras individuais, quando a fatura ainda não foi gerada; ou
- resumo legado de cartão, para lançamentos antigos.

Uma fatura marcada como paga deixa de comprometer o limite daquele mês.

## Exibição
Cada cartão agora mostra também o **Limite total**, além do limite comprometido e disponível, facilitando a conferência.
