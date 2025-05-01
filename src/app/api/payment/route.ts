import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inicializar Stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key_here', {
    apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reservationId, successUrl, cancelUrl } = body;

        if (!reservationId) {
            return NextResponse.json({
                success: false,
                message: "Falta el ID de la reserva"
            }, { status: 400 });
        }

        // Obtener los detalles de la reserva
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                client: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                musician: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!reservation) {
            return NextResponse.json({
                success: false,
                message: "La reserva no existe"
            }, { status: 404 });
        }

        // Crear un precio único para esta transacción
        const price = await stripe.prices.create({
            unit_amount: Math.round(Number(reservation.price) * 100), // Convertir a centavos
            currency: 'cop',
            product_data: {
                name: `Reserva de ${reservation.musician.name}`,
                description: `Reserva para el ${new Date(reservation.serviceDate).toLocaleDateString()}`,
            },
        });

        // Crear una sesión de checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl || process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: cancelUrl || process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payment/cancel',
            client_reference_id: reservationId,
            customer_email: reservation.client.email,
            metadata: {
                reservationId: reservationId,
                musicianId: reservation.musicianId,
                clientId: reservation.clientId
            }
        });

        // Actualizar el estado de la reserva a "payment_pending"
        await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                reservationStatusId: "payment_pending"
            }
        });

        return NextResponse.json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error('Error al procesar el pago:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud de pago"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// Endpoint para manejar los webhooks de Stripe
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json({
                success: false,
                message: "Falta el ID de la sesión"
            }, { status: 400 });
        }

        // Verificar el estado de la sesión en Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const reservationId = session.client_reference_id;

            if (reservationId) {
                // Actualizar el estado de la reserva a "completed"
                await prisma.reservation.update({
                    where: { id: reservationId },
                    data: {
                        reservationStatusId: "completed"
                    }
                });

                // Crear un registro en completedreservation
                await prisma.completedreservation.create({
                    data: {
                        clientId: session.metadata?.clientId || '',
                        musicianId: session.metadata?.musicianId || '',
                        paymentMethodId: "tarjeta" // ID del método de pago (ajustar según tu esquema)
                    }
                });
            }

            return NextResponse.json({
                success: true,
                message: "Pago completado exitosamente"
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "El pago no se ha completado",
                status: session.payment_status
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Error al verificar pago:', error);
        return NextResponse.json({
            success: false,
            message: "Error al verificar el estado del pago"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 