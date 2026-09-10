# NexFin v1.8.5 — conferência e reconciliação do limite dos cartões

## Correções

- O limite agora prioriza as **compras/parcela detalhadas ainda não pagas** como fonte de verdade.
- A fatura consolidada só entra como fallback quando não há itens detalhados para aquele mês, evitando diferenças causadas por faturas antigas ou desatualizadas.
- Lançamentos antigos do tipo **Fatura / Gastos atual** são desconsiderados do limite quando o NexFin encontra um pagamento de fatura no mesmo mês e no mesmo valor.
- Faturas marcadas como pagas não comprometem mais o limite.
- O total de faturas exibido no topo também passa a considerar somente valores efetivamente em aberto, evitando somar documentos duplicados ou já quitados.

## Novo botão: Conferir limite

Em cada cartão há a opção **Conferir limite**, mostrando mês a mês:

- compras detalhadas;
- saldo/fatura anterior;
- fatura consolidada registrada;
- status de fatura paga;
- valor que realmente está sendo usado no cálculo;
- total comprometido;
- limite disponível calculado.

Essa tela facilita comparar o NexFin com o aplicativo do banco e descobrir imediatamente de onde vem qualquer diferença.
