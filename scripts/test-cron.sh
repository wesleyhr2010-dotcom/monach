#!/bin/bash
# Teste das Edge Functions — Monarca
# Salve este arquivo na Área de Trabalho e execute com duplo-clique no Terminal

clear
echo "==================================="
echo "  Teste Edge Functions — Monarca"
echo "==================================="
echo ""

export SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_JWT_HERE"

echo "1/3 Testando check-maleta-prazo..."
curl -s -X POST https://amlwwakxpungeqpiyxwr.supabase.co/functions/v1/check-maleta-prazo \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"

echo ""
echo ""
echo "2/3 Testando marcar-maletas-atrasadas..."
curl -s -X POST https://amlwwakxpungeqpiyxwr.supabase.co/functions/v1/marcar-maletas-atrasadas \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"

echo ""
echo ""
echo "3/3 Testando agrega-analytics-diario..."
curl -s -X POST https://amlwwakxpungeqpiyxwr.supabase.co/functions/v1/agrega-analytics-diario \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"

echo ""
echo ""
echo "==================================="
echo "  Teste concluído!"
echo "==================================="
echo ""
read -p "Pressione Enter para fechar..."
