"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getUserSession } from "@/lib/auth";
import { loadStripe } from "@stripe/stripe-js";

// Inicializar Stripe con la clave pública
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface Reservation {
    id: string;
    clientId: string;
    musicianId: string;
    price: number;
    creationDate: string;
    serviceDate: string;
    reservationStatusId: string;
    client: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    musician: {
        id: string;
        name: string;
    };
    reservationstatus: {
        id: string;
        name: string;
    };
}

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Obtener el rol del usuario desde localStorage
        const storedRole = localStorage.getItem("userRole");
        if (storedRole) {
            setUserRole(storedRole);
        }
    }, []);

    useEffect(() => {
        async function checkSession() {
            const session = await getUserSession();
            if (!session) {
                router.push('/sign-in');
                return;
            }

            // Permitir que tanto clientes como músicos vean sus reservas
            if (session.role === "CLIENT" || session.role === "MUSICIAN") {
                fetchReservations(session.id, session.role);
                // Actualizar el rol del usuario
                setUserRole(session.role);
            } else {
                router.push('/profile');
            }
        }

        checkSession();
    }, [router]);

    const fetchReservations = async (userId: string, role: string) => {
        try {
            setLoading(true);
            // Construir el endpoint basado en el rol del usuario
            const endpoint = role === "CLIENT"
                ? `/api/reservations?clientId=${userId}`
                : `/api/reservations?musicianId=${userId}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setReservations(data.data);
            } else {
                toast.error("Error al cargar reservas");
            }
        } catch (error) {
            console.error("Error al cargar reservas:", error);
            toast.error("Error al cargar reservas");
        } finally {
            setLoading(false);
        }
    };

    const handlePayReservation = async (reservationId: string) => {
        try {
            setProcessingPayment(reservationId);
            toast.info("Iniciando proceso de pago...");

            // Crear una sesión de checkout en el servidor
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reservationId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al procesar el pago");
            }

            // Si tenemos una URL de redirección, usar esa
            if (data.url) {
                window.location.href = data.url;
                return;
            }

            // Si no, usar el sessionId para redirectionar con Stripe.js
            if (data.sessionId) {
                const stripe = await stripePromise;
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({
                        sessionId: data.sessionId,
                    });

                    if (error) {
                        throw new Error(error.message || "Error al redirigir a Stripe");
                    }
                }
            }
        } catch (error) {
            console.error("Error de pago:", error);
            toast.error(
                error instanceof Error ? error.message : "Error al procesar el pago"
            );
        } finally {
            setProcessingPayment(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pendiente":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
            case "Completada":
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Completada</Badge>;
            case "Rechazada":
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rechazada</Badge>;
            case "Pagada":
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Pagada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const chatWithParticipant = (participantId: string) => {
        if (!userRole) return;

        if (userRole === "CLIENT") {
            // Si es cliente, redirigir al perfil del músico con el hash para el chat
            router.push(`/musicians/${participantId}#chat`);
        } else {
            // Si es músico, redirigir al perfil del músico (su propio perfil) con un queryParam para el cliente
            // De esta manera, el componente de chat en el perfil sabrá qué conversación mostrar
            router.push(`/profile?clientId=${participantId}#chat`);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Mis Reservas</CardTitle>
                    <CardDescription>
                        Gestiona tus reservas con {userRole === "CLIENT" ? "músicos" : "clientes"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">Todas</TabsTrigger>
                            <TabsTrigger value="pending">Pendientes</TabsTrigger>
                            <TabsTrigger value="completed">Completadas</TabsTrigger>
                            <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
                        </TabsList>

                        {loading ? (
                            <div className="text-center py-8">Cargando reservas...</div>
                        ) : reservations.length === 0 ? (
                            <div className="text-center py-8">No hay reservas que mostrar</div>
                        ) : (
                            <>
                                <TabsContent value="all">
                                    <ReservationsTable
                                        reservations={reservations}
                                        getStatusBadge={getStatusBadge}
                                        onPay={handlePayReservation}
                                        onChat={chatWithParticipant}
                                        userRole={userRole}
                                        processingPayment={processingPayment}
                                    />
                                </TabsContent>
                                <TabsContent value="pending">
                                    <ReservationsTable
                                        reservations={reservations.filter(r => r.reservationstatus.name === "Pendiente")}
                                        getStatusBadge={getStatusBadge}
                                        onPay={handlePayReservation}
                                        onChat={chatWithParticipant}
                                        userRole={userRole}
                                        processingPayment={processingPayment}
                                    />
                                </TabsContent>
                                <TabsContent value="completed">
                                    <ReservationsTable
                                        reservations={reservations.filter(r => r.reservationstatus.name === "Completada" || r.reservationstatus.name === "Pagada")}
                                        getStatusBadge={getStatusBadge}
                                        onPay={handlePayReservation}
                                        onChat={chatWithParticipant}
                                        userRole={userRole}
                                        processingPayment={processingPayment}
                                    />
                                </TabsContent>
                                <TabsContent value="rejected">
                                    <ReservationsTable
                                        reservations={reservations.filter(r => r.reservationstatus.name === "Rechazada")}
                                        getStatusBadge={getStatusBadge}
                                        onPay={handlePayReservation}
                                        onChat={chatWithParticipant}
                                        userRole={userRole}
                                        processingPayment={processingPayment}
                                    />
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

interface ReservationsTableProps {
    reservations: Reservation[];
    getStatusBadge: (status: string) => React.ReactNode;
    onPay: (reservationId: string) => void;
    onChat: (participantId: string) => void;
    userRole: string | null;
    processingPayment: string | null;
}

function ReservationsTable({ reservations, getStatusBadge, onPay, onChat, userRole, processingPayment }: ReservationsTableProps) {
    const handleReject = (reservationId: string) => {
        console.log("Rechazar reserva:", reservationId);
        // La lógica de rechazo se implementará más adelante
    };

    if (!userRole) {
        return <div className="text-center py-4">Cargando...</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{userRole === "CLIENT" ? "Músico" : "Cliente"}</TableHead>
                    <TableHead>Fecha del Servicio</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                        <TableCell>
                            {userRole === "CLIENT"
                                ? reservation.musician.name
                                : reservation.client.name}
                        </TableCell>
                        <TableCell>{format(new Date(reservation.serviceDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>${reservation.price.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(reservation.reservationstatus.name)}</TableCell>
                        <TableCell className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onChat(userRole === "CLIENT"
                                    ? reservation.musicianId
                                    : reservation.clientId)}
                            >
                                Ir al Chat
                            </Button>

                            {/* Botones específicos según el rol y estado */}
                            {userRole === "CLIENT" && reservation.reservationstatus.name === "Pendiente" && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => onPay(reservation.id)}
                                        disabled={processingPayment === reservation.id}
                                    >
                                        {processingPayment === reservation.id ? "Procesando..." : "Pagar"}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        onClick={() => handleReject(reservation.id)}
                                        disabled={processingPayment === reservation.id}
                                    >
                                        Rechazar
                                    </Button>
                                </>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
} 