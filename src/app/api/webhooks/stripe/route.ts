import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

// Esta función es necesaria para raw body parsing en webhooks
export const config = {
    api: {
        bodyParser: false,
    },
};

async function getRawBody(req: Request): Promise<string> {
    const reader = req.body?.getReader();
    if (!reader) return "";

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) chunks.push(value);
    }

    return new TextDecoder("utf-8").decode(
        chunks.reduce((acc, chunk) => {
            const newArray = new Uint8Array(acc.length + chunk.length);
            newArray.set(acc, 0);
            newArray.set(chunk, acc.length);
            return newArray;
        }, new Uint8Array(0))
    );
}

export async function POST(req: Request) {
    try {
        const body = await getRawBody(req);
        const headersList = headers();
        const signature = headersList.get("stripe-signature") as string;

        if (!signature) {
            return NextResponse.json(
                { error: "Falta stripe-signature" },
                { status: 400 }
            );
        }

        // Verificar el evento de Stripe
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );

        // Manejar el evento de pago exitoso
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            // Obtener datos de la sesión
            const reservationId = session.metadata?.reservationId;

            if (reservationId) {
                // Obtener método de pago por defecto (ejemplo: "card")
                const paymentMethod = await prisma.paymentmethod.findFirst({
                    where: { name: "Tarjeta de crédito" },
                });

                if (!paymentMethod) {
                    console.error("Método de pago no encontrado");
                    return NextResponse.json(
                        { error: "Método de pago no configurado" },
                        { status: 500 }
                    );
                }

                // Obtener la reserva
                const reservation = await prisma.reservation.findUnique({
                    where: { id: reservationId },
                });

                if (!reservation) {
                    console.error("Reserva no encontrada:", reservationId);
                    return NextResponse.json(
                        { error: "Reserva no encontrada" },
                        { status: 404 }
                    );
                }

                // Verificar si ya existe un registro de reserva completada
                const existingCompletedReservation = await prisma.completedreservation.findFirst({
                    where: {
                        clientId: reservation.clientId,
                        musicianId: reservation.musicianId,
                    },
                });

                // Solo crear si no existe
                if (!existingCompletedReservation) {
                    // Crear registro de reserva completada
                    await prisma.completedreservation.create({
                        data: {
                            clientId: reservation.clientId,
                            musicianId: reservation.musicianId,
                            paymentMethodId: paymentMethod.id,
                        },
                    });
                }

                // Buscar primero el estado "Completada", si no existe, usar "Pagada"
                const completedStatus = await prisma.reservationstatus.findFirst({
                    where: { name: "Completada" },
                }) || await prisma.reservationstatus.findFirst({
                    where: { name: "Pagada" },
                });

                if (completedStatus) {
                    // Verificar que el estado actual no sea ya "Completada"
                    if (reservation.reservationStatusId !== completedStatus.id) {
                        await prisma.reservation.update({
                            where: { id: reservationId },
                            data: { reservationStatusId: completedStatus.id },
                        });
                    }
                } else {
                    console.error("Estado 'Completada' o 'Pagada' no encontrado");
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error en webhook de Stripe:", error);
        return NextResponse.json(
            { error: "Error procesando webhook" },
            { status: 400 }
        );
    }
} 