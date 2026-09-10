# NexFin v1.8.1 — liberação do limite ao pagar a fatura

- Ao dar baixa em uma fatura automática do cartão, as parcelas pertencentes àquela fatura passam a ser marcadas como pagas e deixam de comprometer o limite.
- O limite disponível é recalculado em tempo real.
- Se uma fatura paga for excluída/estornada, as parcelas daquela fatura voltam a comprometer o limite.
- O cálculo mantém compatibilidade com faturas antigas já pagas.
- Lançamentos legados usados apenas como resumo de fatura (ex.: “Fatura” / “Gastos atual”) deixam de ser tratados como novas compras para fins de limite, evitando dupla contabilização.
