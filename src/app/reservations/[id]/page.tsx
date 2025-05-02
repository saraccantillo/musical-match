import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ReservationDetailPage({ params }: PageProps) {
    const { id } = await params;

    // Obtener datos de la reserva
    const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
            musician: true,
            client: true,
            reservationstatus: true,
        },
    });

    if (!reservation) {
        notFound();
    }

    // Verificar si la reserva ya está pagada
    const isPaid = reservation.reservationstatus.name === "Pagada";

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Detalles de la Reserva</h1>

                <div className="grid gap-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm text-gray-500">Músico</h3>
                            <p className="font-medium">{reservation.musician.name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm text-gray-500">Cliente</h3>
                            <p className="font-medium">{reservation.client.name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm text-gray-500">Fecha del Servicio</h3>
                            <p className="font-medium">
                                {new Date(reservation.serviceDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm text-gray-500">Estado</h3>
                            <p className="font-medium">{reservation.reservationstatus.name}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm text-gray-500">Precio</h3>
                        <p className="text-xl font-bold">${Number(reservation.price).toFixed(2)}</p>
                    </div>
                </div>

                {/* Mostrar opciones basadas en el estado */}
                {!isPaid && (
                    <div className="mt-8">
                        <Button asChild className="w-full mb-2">
                            <Link href="/reservations">
                                Ir a Mis Reservas para Pagar
                            </Link>
                        </Button>
                    </div>
                )}

                {isPaid && (
                    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800 font-medium text-center">
                            ¡El pago ha sido completado correctamente!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 