import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function SuccessPage({
    searchParams,
}: {
    searchParams: { session_id: string; reservation_id: string };
}) {
    const { session_id, reservation_id } = searchParams;

    // Verificar si tenemos los parámetros necesarios
    if (!session_id || !reservation_id) {
        redirect("/");
    }

    // Obtener datos de la reserva
    const reservation = await prisma.reservation.findUnique({
        where: { id: reservation_id },
        include: {
            musician: true,
            reservationstatus: true,
        },
    });

    if (!reservation) {
        redirect("/");
    }

    // Buscar el estado "Completada" o "Pagada" en la base de datos
    const completedStatus = await prisma.reservationstatus.findFirst({
        where: { name: "Completada" },
    }) || await prisma.reservationstatus.findFirst({
        where: { name: "Pagada" },
    });

    if (completedStatus && reservation.reservationStatusId !== completedStatus.id) {
        // Actualizar el estado de la reserva a completada
        await prisma.reservation.update({
            where: { id: reservation_id },
            data: { reservationStatusId: completedStatus.id },
        });

        // Verificar si ya existe un registro en completedreservation
        const existingCompletedReservation = await prisma.completedreservation.findFirst({
            where: {
                clientId: reservation.clientId,
                musicianId: reservation.musicianId,
            },
        });

        // Si no existe, crear el registro en la tabla completedreservation
        if (!existingCompletedReservation) {
            // Obtener método de pago por defecto
            const paymentMethod = await prisma.paymentmethod.findFirst({
                where: { name: "Tarjeta de crédito" },
            }) || await prisma.paymentmethod.findFirst();

            if (paymentMethod) {
                await prisma.completedreservation.create({
                    data: {
                        clientId: reservation.clientId,
                        musicianId: reservation.musicianId,
                        paymentMethodId: paymentMethod.id,
                    },
                });
            }
        }
    }

    return (
        <div className="container mx-auto max-w-3xl py-16 px-4">
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-green-500 mx-auto mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        ¡Pago Exitoso!
                    </h1>
                    <p className="text-gray-600 mb-2">
                        Tu reservación con {reservation.musician.name} ha sido confirmada.
                    </p>
                    <p className="text-gray-600 mb-6">
                        Fecha del servicio:{" "}
                        {new Date(reservation.serviceDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-800 font-semibold mb-2">
                        Monto pagado: ${Number(reservation.price).toFixed(2)}
                    </p>
                    <p className="text-gray-600 text-sm mb-8">
                        ID de transacción: {session_id}
                    </p>
                </div>

                <div className="flex flex-col space-y-4">
                    <Button asChild className="w-full">
                        <Link href="/reservations">Ver mis reservaciones</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">Volver al inicio</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
} 