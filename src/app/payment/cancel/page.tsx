import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CancelPage({
    searchParams,
}: {
    searchParams: Promise<{ reservation_id: string }>;
}) {
    const { reservation_id } = await searchParams;

    return (
        <div className="container mx-auto max-w-3xl py-16 px-4">
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-red-500 mx-auto mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Pago Cancelado
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Tu pago ha sido cancelado y no se ha realizado ningún cargo.
                    </p>
                    <p className="text-gray-600 mb-8">
                        Puedes intentar nuevamente o contactar con soporte si necesitas ayuda.
                    </p>
                </div>

                <div className="flex flex-col space-y-4">
                    {reservation_id && (
                        <Button asChild className="w-full">
                            <Link href={`/reservations/${reservation_id}`}>
                                Volver a la reservación
                            </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">Volver al inicio</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
} 