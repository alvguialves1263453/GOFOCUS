# Asaas Payment Integration — Guia de Deploy

## 1. Pré-requisitos

- Conta Asaas (sandbox + production) com API Key gerada
- Supabase CLI instalado: `npm install -g supabase`
- Logado no Supabase: `supabase login`

## 2. Migration SQL

Aplicar `supabase/migrations/20260619000001_asaas_integration.sql` no SQL Editor do Supabase Dashboard (ou via CLI).

Adiciona:
- `profiles.cpf` — CPF do cliente
- `profiles.asaas_customer_id` — ID do cliente no Asaas
- `pedidos.pix_qrcode_image_url` — QR Code PIX (base64 ou URL)
- `pedidos.pix_qrcode_text` — Código PIX copiável
- `pedidos.asaas_invoice_url` — URL da fatura (boleto/cartão)
- `pedidos.asaas_payment_id` — ID da cobrança no Asaas

## 3. Secrets do Supabase

```bash
supabase secrets set ASAAS_API_KEY=<sua_api_key_asaas>
supabase secrets set ASAAS_ENV=sandbox
supabase secrets set ASAAS_WEBHOOK_SECRET=<seu_webhook_secret>
```

O webhook secret é configurado no painel do Asaas > Configurações > Webhooks.

## 4. Deploy das Edge Functions

```bash
supabase functions deploy asaas-create-payment
supabase functions deploy asaas-webhook
supabase functions deploy asaas-refund-payment
```

## 5. Configurar Webhook no Asaas

No painel Asaas:
- URL: `https://<seu-projeto>.supabase.co/functions/v1/asaas-webhook`
- Eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`
- Versão: v3
- Marcar "Enviar apenas eventos selecionados"

## 6. Variáveis de Ambiente (`.env`)

Já adicionado:
```
VITE_ASAAS_ENV=sandbox
```

## 7. Fluxo Completo

1. Cliente seleciona fotos → checkout → preenche dados + CPF + escolhe forma de pagamento
2. Pedido criado no Supabase (status: `aguardando`)
3. Edge Function `asaas-create-payment` cria cliente + cobrança no Asaas
4. Frontend exibe QR Code PIX ou redireciona para fatura
5. Asaas envia webhook quando pagamento é confirmado
6. Edge Function `asaas-webhook` atualiza pedido para `pago`
7. Frontend detecta mudança via polling e redireciona
8. Cliente baixa as fotos em `/download/:id`

## 8. Fallback

Se Asaas estiver fora do ar ou webhook não chegar:
- Admin pode marcar manualmente como "Pago" no painel `/admin/pedidos`
- O campo `asaas_payment_id` permite rastrear a cobrança no Asaas
