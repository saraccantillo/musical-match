# Configuración de Stripe para Musical Match

Este documento proporciona las instrucciones para configurar Stripe como pasarela de pago en la aplicación Musical Match.

## Requisitos Previos

1. Crear una cuenta en Stripe: [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Obtener las claves API (en modo prueba para desarrollo)

## Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
# Base URL para la aplicación (usado para callbacks)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Claves API de Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Secreto del webhook de Stripe
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

## Configuración del Webhook de Stripe

1. En el dashboard de Stripe, ve a **Developers > Webhooks**
2. Haz clic en **Add Endpoint**
3. URL del endpoint: `https://tu-dominio.com/api/webhooks/stripe` (para desarrollo local, usa [Stripe CLI](https://stripe.com/docs/stripe-cli) para pruebas)
4. Selecciona los eventos: `checkout.session.completed` (mínimo requerido)
5. Copia el **Signing Secret** generado y colócalo en la variable `STRIPE_WEBHOOK_SECRET`

## Pruebas Locales con Stripe CLI

Para probar los webhooks localmente:

1. Instala [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Ejecuta autenticación: `stripe login`
3. Reenvía los eventos a tu servidor local: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`

## Tarjetas de Prueba

Para pruebas, puedes usar estas tarjetas:

- **Exitoso**: 4242 4242 4242 4242
- **Fallido**: 4000 0000 0000 0002
- **Requiere autenticación**: 4000 0027 6000 3184

Fecha de expiración: cualquier fecha futura
CVC: cualquier número de 3 dígitos
Código postal: cualquier código postal válido

## Componentes de Pago Implementados

1. **API de Checkout** (`/api/checkout`): Crea sesiones de pago
2. **Webhook de Stripe** (`/api/webhooks/stripe`): Procesa eventos de Stripe

## Flujo de Pago

1. Usuario hace clic en "Pagar Ahora" en la página de reserva
2. Se crea una sesión de pago en el servidor
3. Usuario es redirigido a la página de checkout de Stripe
4. Después del pago, Stripe redirige al usuario a la página de éxito/cancelación
5. El webhook recibe la notificación del pago y actualiza la base de datos

## Solución de Problemas

- **Logs de Webhook**: Revisa los logs del servidor para eventos de webhook
- **Dashboard de Stripe**: Verifica los pagos y eventos en el dashboard de Stripe
- **Stripe CLI**: Usa `stripe listen` para depurar webhooks localmente
