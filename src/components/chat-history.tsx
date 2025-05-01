"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Chat } from "@/components/chat";

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

interface Conversation {
    id: string;
    clientId: string;
    musicianId: string;
    clientName: string;
    musicianName: string;
    lastMessage: string;
    timestamp: string;
}

interface ChatHistoryProps {
    showOnlyChats?: boolean;
}

export function ChatHistory({ showOnlyChats }: ChatHistoryProps) {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("pending");
    const [loadingError, setLoadingError] = useState<string | null>(null);

    useEffect(() => {
        // Obtener el rol del usuario desde localStorage
        const storedRole = localStorage.getItem("userRole");
        const storedUser = localStorage.getItem("userData");

        if (storedRole) {
            setUserRole(storedRole);
        }

        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUserId(userData.id);
            } catch (error) {
                console.error("Error parsing user data", error);
                setLoadingError("Error al cargar datos del usuario");
            }
        }
    }, []);

    // Cargar reservas solo si no estamos en modo chats
    useEffect(() => {
        const fetchReservations = async () => {
            if (!userId || !userRole || showOnlyChats) return;

            setLoading(true);
            setLoadingError(null);

            try {
                // Construir el parámetro según el rol
                const param = userRole === "CLIENT" ? `clientId=${userId}` : `musicianId=${userId}`;
                const response = await fetch(`/api/reservations?${param}`);

                if (!response.ok) {
                    throw new Error('Error obteniendo reservas');
                }

                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    setReservations(data.data);
                } else {
                    throw new Error('Formato de respuesta inesperado');
                }
            } catch (error) {
                console.error('Error al cargar reservas:', error);
                setLoadingError("Error al cargar las reservas. Por favor, intenta nuevamente.");
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [userId, userRole, showOnlyChats]);

    // Cargar conversaciones solo en modo chats
    useEffect(() => {
        const fetchConversations = async () => {
            if (!userId || !userRole) return;

            setLoading(true);
            setLoadingError(null);

            try {
                // Obtener todas las conversaciones del usuario
                const param = userRole === "CLIENT" ? `clientId=${userId}` : `musicianId=${userId}`;
                const response = await fetch(`/api/messages/conversations?${param}`);

                if (!response.ok) {
                    throw new Error('Error obteniendo conversaciones');
                }

                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    // Las conversaciones ya vienen con toda la información necesaria
                    setConversations(data.data);
                } else {
                    throw new Error('Formato de respuesta inesperado');
                }
            } catch (error) {
                console.error('Error al cargar conversaciones:', error);
                setLoadingError("Error al cargar los chats. Por favor, intenta nuevamente.");
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [userId, userRole]);

    const handleReservationSelect = (reservation: Reservation) => {
        setSelectedReservation(reservation);
        setSelectedConversation(null);
    };

    const handleConversationSelect = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setSelectedReservation(null);
    };

    const handleUpdateStatus = async (reservationId: string, status: string) => {
        try {
            setProcessing(true);
            const response = await fetch('/api/reservations', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: reservationId,
                    status
                }),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar estado');
            }

            const data = await response.json();

            if (data.success) {
                // Actualizar localmente
                setReservations(prev =>
                    prev.map(res =>
                        res.id === reservationId
                            ? { ...res, reservationStatusId: status, reservationstatus: { ...res.reservationstatus, id: status, name: getStatusName(status) } }
                            : res
                    )
                );

                if (selectedReservation?.id === reservationId) {
                    setSelectedReservation({
                        ...selectedReservation,
                        reservationStatusId: status,
                        reservationstatus: {
                            ...selectedReservation.reservationstatus,
                            id: status,
                            name: getStatusName(status)
                        }
                    });
                }
            } else {
                throw new Error(data.message || 'Error al actualizar el estado');
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Hubo un error al actualizar el estado. Por favor, inténtalo de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    const handlePayment = async (reservationId: string) => {
        if (!reservationId) return;

        setProcessing(true);

        try {
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reservationId,
                    successUrl: `${window.location.origin}/payment/success`,
                    cancelUrl: `${window.location.origin}/payment/cancel`
                }),
            });

            if (!response.ok) {
                throw new Error('Error al iniciar el proceso de pago');
            }

            const data = await response.json();

            if (data.success && data.url) {
                // Redirigir al usuario a la página de pago
                window.location.href = data.url;
            } else {
                throw new Error('No se pudo obtener la URL de pago');
            }
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            alert('Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusName = (statusId: string): string => {
        switch (statusId) {
            case "accepted": return "Aceptada";
            case "rejected": return "Rechazada";
            case "pending": return "Pendiente";
            case "completed": return "Completada";
            case "canceled": return "Cancelada";
            case "payment_pending": return "Pago Pendiente";
            default: return "Desconocido";
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case "accepted":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "canceled":
                return "bg-gray-100 text-gray-800";
            case "payment_pending":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Filtrar reservas según la pestaña activa (solo aplica en modo reservas)
    const filteredReservations = reservations.filter(res => {
        if (activeTab === "all") return true;
        return res.reservationStatusId === activeTab;
    });

    // Manejar la aceptación de una prereservación
    const handleAcceptPrereservation = async (clientId: string, musicianId: string) => {
        // Solo permitir que los músicos acepten prereservaciones
        if (userRole !== "MUSICIAN") return;

        if (!clientId || !musicianId) return;

        try {
            setProcessing(true);

            // Obtener la conversación para extraer los datos de la reserva del primer mensaje
            const response = await fetch(`/api/conversations?clientId=${clientId}&musicianId=${musicianId}`);
            if (!response.ok) {
                throw new Error('Error al obtener la conversación');
            }

            const data = await response.json();

            if (!data.success || !data.data || !data.data.messages || data.data.messages.length === 0) {
                throw new Error('No se encontraron mensajes en la conversación');
            }

            // Obtener el primer mensaje (mensaje de solicitud de reserva)
            const firstMessage = data.data.messages[0];

            // Extraer datos del mensaje
            const messageContent = firstMessage.content;

            // Precio de la reserva
            const priceMatch = messageContent.match(/Precio inicial: COP \$([0-9,]+)/);
            const priceString = priceMatch ? priceMatch[1].replace(/,/g, '') : "200000";
            const price = parseInt(priceString, 10);

            // Fecha del evento
            const dateMatch = messageContent.match(/Fecha: (\d{2}\/\d{2}\/\d{4})/);
            let serviceDate = new Date();
            if (dateMatch) {
                const dateParts = dateMatch[1].split('/');
                serviceDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
            } else {
                // Si no se puede extraer, usar fecha a una semana de hoy
                serviceDate.setDate(serviceDate.getDate() + 7);
            }

            // Tipo de evento
            const eventTypeMatch = messageContent.match(/Tipo de evento: ([^\n]+)/);
            const eventType = eventTypeMatch ? eventTypeMatch[1].trim() : 'Evento';

            console.log("Creando reserva con datos extraídos:", {
                clientId,
                musicianId,
                price,
                serviceDate: serviceDate.toISOString(),
                eventType
            });

            const createResponse = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId,
                    musicianId,
                    price,
                    serviceDate: serviceDate.toISOString(),
                    eventType
                }),
            });

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                console.error("Error al crear reserva:", errorData);
                throw new Error(errorData.message || 'Error al crear la reserva');
            }

            const createData = await createResponse.json();

            if (createData.success) {
                // Recargar las reservaciones
                window.location.reload();
            } else {
                throw new Error(createData.message || 'Error al crear la reserva');
            }
        } catch (error) {
            console.error('Error al crear reserva:', error);
            alert('Hubo un error al crear la reserva. Por favor, inténtalo de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8">Cargando...</div>;
    }

    if (loadingError) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{loadingError}</p>
                <Button onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="h-full">
            <Tabs defaultValue={showOnlyChats ? "all" : "pending"} className="h-full flex flex-col">
                {!showOnlyChats && (
                    <TabsList className="justify-start">
                        <TabsTrigger value="pending" onClick={() => setActiveTab("pending")}>
                            Pendientes
                        </TabsTrigger>
                        <TabsTrigger value="accepted" onClick={() => setActiveTab("accepted")}>
                            Aceptadas
                        </TabsTrigger>
                        <TabsTrigger value="payment_pending" onClick={() => setActiveTab("payment_pending")}>
                            Pago Pendiente
                        </TabsTrigger>
                        <TabsTrigger value="completed" onClick={() => setActiveTab("completed")}>
                            Completadas
                        </TabsTrigger>
                        <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
                            Todas
                        </TabsTrigger>
                    </TabsList>
                )}

                {showOnlyChats && (
                    <div className="pb-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Mis Conversaciones</h2>
                            <p className="text-sm text-gray-500">Gestiona todos tus chats con clientes</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="space-y-4">
                            {showOnlyChats ? (
                                // Mostrar lista de conversaciones
                                conversations.length > 0 ? (
                                    conversations.map((conversation) => (
                                        <Card
                                            key={conversation.id}
                                            className={`cursor-pointer ${selectedConversation?.id === conversation.id ? 'border-black' : ''}`}
                                            onClick={() => handleConversationSelect(conversation)}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-lg">
                                                        {userRole === "CLIENT" ? conversation.musicianName : conversation.clientName}
                                                    </CardTitle>
                                                </div>
                                                <CardDescription>
                                                    {conversation.lastMessage.length > 30
                                                        ? conversation.lastMessage.substring(0, 30) + '...'
                                                        : conversation.lastMessage}
                                                    <br />
                                                    {format(new Date(conversation.timestamp), "dd/MM/yyyy HH:mm")}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center p-6 bg-gray-50 border rounded-lg">
                                        <p className="text-gray-500">No tienes conversaciones</p>
                                    </div>
                                )
                            ) : (
                                // Mostrar lista de reservas (código original)
                                filteredReservations.length > 0 ? (
                                    filteredReservations.map((reservation) => (
                                        <Card
                                            key={reservation.id}
                                            className={`cursor-pointer ${selectedReservation?.id === reservation.id ? 'border-black' : ''}`}
                                            onClick={() => handleReservationSelect(reservation)}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-lg">
                                                        {userRole === "CLIENT" ? reservation.musician.name : reservation.client.name}
                                                    </CardTitle>
                                                    <Badge className={getStatusColor(reservation.reservationStatusId)}>
                                                        {reservation.reservationstatus.name}
                                                    </Badge>
                                                </div>
                                                <CardDescription>
                                                    Fecha: {format(new Date(reservation.serviceDate), "dd/MM/yyyy")}
                                                    <br />
                                                    Precio: ${reservation.price.toLocaleString()}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center p-6 bg-gray-50 border rounded-lg">
                                        <p className="text-gray-500">No hay reservas en esta categoría</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        {selectedReservation && !showOnlyChats ? (
                            // Mostrar detalles de reserva y chat (código original)
                            <div className="border rounded-lg h-full">
                                <div className="p-4 border-b">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {userRole === "CLIENT" ? selectedReservation.musician.name : selectedReservation.client.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Reserva para el {format(new Date(selectedReservation.serviceDate), "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(selectedReservation.reservationStatusId)}>
                                            {selectedReservation.reservationstatus.name}
                                        </Badge>
                                    </div>

                                    {/* Mostrar botones de acción según el rol y estado */}
                                    {userRole === "MUSICIAN" && selectedReservation.reservationStatusId === "pending" && (
                                        <div className="mt-4 flex gap-2">
                                            <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleUpdateStatus(selectedReservation.id, "accepted")}
                                                disabled={processing}
                                            >
                                                {processing ? 'Procesando...' : 'Aceptar Reserva'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                onClick={() => handleUpdateStatus(selectedReservation.id, "rejected")}
                                                disabled={processing}
                                            >
                                                {processing ? 'Procesando...' : 'Rechazar'}
                                            </Button>
                                        </div>
                                    )}

                                    {userRole === "CLIENT" && selectedReservation.reservationStatusId === "accepted" && (
                                        <div className="mt-4">
                                            <Button
                                                className="bg-black hover:bg-gray-800"
                                                onClick={() => handlePayment(selectedReservation.id)}
                                                disabled={processing}
                                            >
                                                {processing ? 'Procesando...' : 'Proceder al Pago'}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Componente de chat para reserva */}
                                <Chat
                                    clientId={selectedReservation.clientId}
                                    musicianId={selectedReservation.musicianId}
                                    clientName={selectedReservation.client.name}
                                    musicianName={selectedReservation.musician.name}
                                    onAcceptPrereservation={handleAcceptPrereservation}
                                />
                            </div>
                        ) : selectedConversation && showOnlyChats ? (
                            // Mostrar solo el chat para una conversación seleccionada
                            <div className="border rounded-lg h-full">
                                <Chat
                                    clientId={selectedConversation.clientId}
                                    musicianId={selectedConversation.musicianId}
                                    clientName={selectedConversation.clientName}
                                    musicianName={selectedConversation.musicianName}
                                    onAcceptPrereservation={handleAcceptPrereservation}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full border rounded-lg p-8 bg-gray-50">
                                <p className="text-gray-500">
                                    {showOnlyChats
                                        ? 'Selecciona una conversación para ver el chat'
                                        : 'Selecciona una reserva para ver la conversación'
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Tabs>
        </div>
    );
} 