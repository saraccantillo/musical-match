"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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

interface ReservationsTableProps {
    onChatSelect?: (clientId: string) => void;
}

export default function ReservationsTable({ onChatSelect }: ReservationsTableProps) {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [userRole, setUserRole] = useState<"CLIENT" | "MUSICIAN" | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>("all");

    useEffect(() => {
        // Obtener el rol del usuario desde localStorage
        const storedRole = localStorage.getItem("userRole");
        const storedUser = localStorage.getItem("userData");

        if (storedRole) {
            setUserRole(storedRole as "CLIENT" | "MUSICIAN" | null);
        }

        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUserId(userData.id);
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }
    }, []);

    // Detectar cambios en los filtros de pestañas
    useEffect(() => {
        const handleTabChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail && customEvent.detail.tab) {
                setActiveFilter(customEvent.detail.tab);
            }
        };

        document.addEventListener('tabChange', handleTabChange);
        return () => {
            document.removeEventListener('tabChange', handleTabChange);
        };
    }, []);

    // Carga inicial de datos
    useEffect(() => {
        async function loadData() {
            if (!userRole || !userId) return;

            try {
                setLoading(true);
                await loadReservations();
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [userRole, userId]);

    // Cargar reservaciones
    const loadReservations = async () => {
        try {
            // Lógica para cargar las reservaciones según el rol
            const endpoint = userRole === "CLIENT"
                ? `/api/reservations?clientId=${userId}`
                : `/api/reservations?musicianId=${userId}`;

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error('Error al cargar reservaciones');
            }

            const data = await response.json();
            setReservations(data.data || []);
        } catch (error) {
            console.error("Error al cargar reservaciones:", error);
            throw error;
        }
    };

    // Función para aplicar el estilo de badge según el estado
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pendiente":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
            case "Completada":
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Completada</Badge>;
            case "Rechazada":
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rechazada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Función para filtrar reservaciones según el estado activo
    const getFilteredReservations = () => {
        if (activeFilter === "all" || !activeFilter) {
            return reservations;
        }

        return reservations.filter(res => {
            // Mapear el estado de la reserva al valor del filtro
            const statusMap: Record<string, string> = {
                "Pendiente": "pending",
                "Completada": "completed",
                "Rechazada": "rejected"
            };

            const reservationStatus = statusMap[res.reservationstatus.name] || "";
            return reservationStatus === activeFilter;
        });
    };

    // Función para manejar la navegación a chats
    const handleChatNavigation = (clientId: string) => {
        if (onChatSelect) {
            // Si existe la función de callback, usarla
            onChatSelect(clientId);
        } else {
            // Fallback: intentar cambiar a la pestaña de chats mediante un evento personalizado
            const tabChangeEvent = new CustomEvent('switchToChatsTab', {
                detail: {
                    userId: userRole === "MUSICIAN" ? clientId : userId
                }
            });
            document.dispatchEvent(tabChangeEvent);
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{userRole === "MUSICIAN" ? "Cliente" : "Músico"}</TableHead>
                    <TableHead>Fecha del Servicio</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Cargando reservaciones...</TableCell>
                    </TableRow>
                ) : reservations.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">No tienes reservaciones activas</TableCell>
                    </TableRow>
                ) : (
                    getFilteredReservations().map((reservation) => (
                        <TableRow key={reservation.id}>
                            <TableCell className="font-medium">
                                {userRole === "MUSICIAN" ? reservation.client.name : reservation.musician.name}
                            </TableCell>
                            <TableCell>
                                {format(new Date(reservation.serviceDate), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                                ${Number(reservation.price).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(reservation.reservationstatus.name)}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleChatNavigation(userRole === "MUSICIAN" ? reservation.clientId : reservation.musicianId)}
                                >
                                    Ir al Chat
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
} 