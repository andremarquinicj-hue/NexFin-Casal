# NexFin v1.5 — Fechamento mensal + Calendário financeiro

## Fechamento mensal

Nova área **Fechamento** no menu lateral.

Permite selecionar qualquer mês e visualizar:

- entradas previstas e realizadas;
- despesas previstas e realizadas;
- resultado previsto e realizado;
- saldo atual das contas cadastradas;
- quantidade e valor de pendências;
- composição das despesas por categoria;
- histórico dos meses já fechados.

Ao clicar em **Fechar este mês**, o NexFin salva uma fotografia financeira daquele momento em `monthlyClosings/{AAAA-MM}` no Firestore.

O fechamento **não bloqueia** lançamentos. Se uma despesa ou receita for corrigida depois, basta abrir o mesmo mês e clicar em **Atualizar fechamento**.

## Calendário financeiro mensal

Nova área **Calendário** no menu lateral.

Ela mostra:

- entradas e saídas organizadas por dia;
- compromissos de cada data;
- resumo total de entradas e saídas do mês;
- detalhes do dia selecionado;
- status previsto, pago ou recebido;
- navegação entre meses.

Compras individuais do cartão não são duplicadas no calendário: o fluxo financeiro usa somente a **fatura consolidada** do cartão.

## Firebase

Não é necessário alterar as regras do Firestore já usadas no NexFin. A regra genérica das subcoleções da família já abrange `monthlyClosings`.
