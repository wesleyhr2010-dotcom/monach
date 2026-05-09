---
plan: 17-04
status: complete
completed_at: "2026-05-08T21:30:00.000Z"
---

# 17-04 SUMMARY — PDV Steps 3-4 + Splash (Fluxo Completo)

## Objective
Completar o PDV: Step 3 (Moneda), Step 4 (Resumen + Confirmar venta), Splash de sucesso. Integrar em PdvClient.tsx.

## What was built
- `PdvStepMoneda.tsx`: radio cards de moeda (PYG/USD/BRL), display de cotização formatado, total estimado convertido client-side, alerta quando sem cotização
- `PdvStepResumen.tsx`: tabela de resumo (Producto/Cant./Precio/Subtotal), seção cliente, seção moneda, total final, botão "Confirmar venta" que chama `criarVentaLoja`
- `PdvSplashSuccess.tsx`: splash de sucesso com ícone 64px, total, cliente label, botões "Nueva venta" (reset) e "Ver detalles" (link futuro)
- `PdvClient.tsx`: atualizado — placeholders removidos, componentes reais integrados

## Key files created/modified
- `src/app/admin/pdv/PdvStepMoneda.tsx` — new
- `src/app/admin/pdv/PdvStepResumen.tsx` — new
- `src/app/admin/pdv/PdvSplashSuccess.tsx` — new
- `src/app/admin/pdv/PdvClient.tsx` — modified (imports added, placeholders removed)

## Self-Check: PASSED
- TypeScript compiles zero errors
- All acceptance criteria met
- Zero hex hardcoded, ES-PY copy exact
- Splash renders in-place (no router.push)
- `criarVentaLoja` called with minimal payload (only IDs + cantidad)

## Deviations
None.
