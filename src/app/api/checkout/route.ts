import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function POST(request: Request) {
    try {
        const {
            reservationId,
            successUrl,
            cancelUrl
        } = await request.json();

        // Validar datos necesarios
        if (!reservationId) {
            return NextResponse.json(
                { error: "ID de reserva requerido" },
                { status: 400 }
            );
        }

        // Obtener detalles de la reserva
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                musician: true,
                client: true,
            },
        });

        if (!reservation) {
            return NextResponse.json(
                { error: "Reserva no encontrada" },
                { status: 404 }
            );
        }

        // Verificar que no esté ya pagada
        const completedStatus = await prisma.reservationstatus.findFirst({
            where: { name: "Completada" },
        }) || await prisma.reservationstatus.findFirst({
            where: { name: "Pagada" },
        });

        if (completedStatus && reservation.reservationStatusId === completedStatus.id) {
            return NextResponse.json(
                { error: "Esta reserva ya ha sido pagada" },
                { status: 400 }
            );
        }

        // Crear la sesión de checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "mxn", // Ajusta según tu moneda
                        product_data: {
                            name: `Servicio musical con ${reservation.musician.name}`,
                            description: `Reserva para el ${new Date(reservation.serviceDate).toLocaleDateString()}`,
                        },
                        unit_amount: Math.round(Number(reservation.price) * 100), // Stripe usa centavos
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId}`,
            cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel?reservation_id=${reservationId}`,
            client_reference_id: reservationId,
            metadata: {
                reservationId: reservationId,
                clientId: reservation.clientId,
                musicianId: reservation.musicianId,
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error("Error al crear la sesión de checkout:", error);
        return NextResponse.json(
            { error: "Error al procesar el pago" },
            { status: 500 }
        );
    }
} 