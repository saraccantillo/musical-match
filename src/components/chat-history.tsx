"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ReservationData } from "@/components/reservation-form";

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
    messages: Message[];
    updatedAt: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderType: string;
    timestamp: string;
}

interface ChatHistoryProps {
    showOnlyChats: boolean;
    showChatsHeader?: boolean;
    initialMusicianId?: string | null;
    specificMusicianId?: string;
    specificClientId?: string | null;
    useTableLayout?: boolean;
}

export function ChatHistory({ showOnlyChats, showChatsHeader = true, initialMusicianId = null, specificMusicianId, specificClientId = null, useTableLayout = false }: ChatHistoryProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [userRole, setUserRole] = useState<"CLIENT" | "MUSICIAN" | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [view, setView] = useState<'chats' | 'reservations'>(showOnlyChats ? 'chats' : 'reservations');
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [processedClientId, setProcessedClientId] = useState<string | null>(null);

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

    // Detectar cambios en los filtros de pestañas cuando estamos en modo tabla
    useEffect(() => {
        if (useTableLayout) {
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
        }
    }, [useTableLayout]);

    // Carga inicial de datos
    useEffect(() => {
        async function loadData() {
            if (!userRole || !userId) return;

            try {
                setLoading(true);
                // Cargar conversaciones (chats)
                await loadConversations();

                // Si necesitamos mostrar reservaciones también
                if (!showOnlyChats) {
                    await loadReservations();
                }
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [userRole, userId, showOnlyChats]);

    // Cargar conversación completa para el chat seleccionado
    const loadFullConversation = useCallback(async (clientId: string, musicianId: string) => {
        if (!clientId || !musicianId) return null;

        try {
            setIsProcessing(true);
            // Obtener la conversación completa con todos los mensajes
            const response = await fetch(`/api/conversations?clientId=${clientId}&musicianId=${musicianId}`);

            if (!response.ok) {
                throw new Error('Error al cargar la conversación completa');
            }

            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error("Error al cargar la conversación completa:", error);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Manejar la selección de una conversación
    const handleSelectConversation = useCallback(async (conversation: Conversation) => {
        try {
            // Cargar la conversación completa con mensajes
            const fullConversation = await loadFullConversation(
                conversation.clientId,
                conversation.musicianId
            );

            if (fullConversation) {
                // Actualizar la conversación seleccionada con todos los mensajes
                setSelectedConversation({
                    ...conversation,
                    messages: fullConversation.messages || []
                });
            } else {
                // Si no se pudo cargar la conversación completa, usar la información básica
                setSelectedConversation(conversation);
            }
        } catch (error) {
            console.error("Error al seleccionar conversación:", error);
            // En caso de error, intentar mostrar la conversación básica
            setSelectedConversation(conversation);
        }
    }, [loadFullConversation]);

    // Manejar la creación de una nueva reservación basada en datos de chat
    const handleCreateReservation = async (clientId: string, musicianId: string, reservationData: ReservationData) => {
        console.log("handleCreateReservation llamado con:", { clientId, musicianId, reservationData });
        // Solo permitir que los músicos creen reservaciones
        if (userRole !== "MUSICIAN") {
            console.error("Error: Solo los músicos pueden crear reservaciones");
            return false;
        }
        if (!clientId || !musicianId || !reservationData) {
            console.error("Error: Faltan datos requeridos para la reservación");
            return false;
        }

        setIsProcessing(true);
        console.log("Procesando creación de reserva...");

        try {
            // Extraer datos de la solicitud de reservación
            const { eventType, eventDate, initialPrice } = reservationData;
            const serviceDate = new Date(eventDate);
            const price = initialPrice;

            console.log("Creando reserva con datos:", {
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

            const responseText = await createResponse.text();
            console.log("Respuesta API texto:", responseText);

            let createData;
            try {
                createData = JSON.parse(responseText);
            } catch (e) {
                console.error("Error al parsear respuesta JSON:", e);
                throw new Error("Respuesta del servidor no es un JSON válido");
            }

            if (!createResponse.ok) {
                console.error("Error en la respuesta del servidor:", createData);
                throw new Error(createData?.message || 'Error al crear la reserva');
            }

            if (createData.success) {
                // Recargar las reservaciones si se están mostrando
                if (!showOnlyChats) {
                    console.log("Recargando lista de reservas...");
                    await loadReservations();
                }
                console.log("Reserva creada exitosamente:", createData);
                alert('Reserva creada con éxito');
                return true;
            } else {
                console.error("La respuesta indica fallo:", createData);
                throw new Error(createData.message || 'Error al crear la reserva');
            }
        } catch (error) {
            console.error('Error al crear reserva:', error);
            alert('Hubo un error al crear la reserva. Por favor, inténtalo de nuevo.');
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    // Cargar conversaciones
    const loadConversations = async () => {
        try {
            // Lógica para cargar las conversaciones según el rol del usuario
            let endpoint = userRole === "CLIENT"
                ? `/api/conversations?clientId=${userId}`
                : `/api/conversations?musicianId=${userId}`;

            // Si hay un ID de músico específico y el usuario es un cliente, filtrar por ese músico
            if (specificMusicianId && userRole === "CLIENT") {
                endpoint = `/api/conversations?clientId=${userId}&musicianId=${specificMusicianId}`;
            }
            // Si hay un musicianId inicial y el usuario es un cliente, filtrar solo esa conversación
            else if (initialMusicianId && userRole === "CLIENT") {
                endpoint = `/api/conversations?clientId=${userId}&musicianId=${initialMusicianId}`;
            }

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error('Error al cargar conversaciones');
            }

            const data = await response.json();

            // Si es una conversación específica, formatearla como un array
            if ((specificMusicianId || initialMusicianId) && userRole === "CLIENT" && data.success && data.data) {
                // Si la respuesta es una conversación específica (tiene messages), formatearla
                if (data.data.messages) {
                    const musicianId = specificMusicianId || initialMusicianId;
                    setConversations([{
                        id: crypto.randomUUID(), // Generar un ID temporal
                        clientId: userId as string,
                        musicianId: musicianId as string,
                        clientName: data.data.clientName,
                        musicianName: data.data.musicianName,
                        messages: data.data.messages,
                        updatedAt: new Date().toISOString()
                    }]);
                    // También seleccionar automáticamente esta conversación
                    setSelectedConversation({
                        id: crypto.randomUUID(),
                        clientId: userId as string,
                        musicianId: musicianId as string,
                        clientName: data.data.clientName,
                        musicianName: data.data.musicianName,
                        messages: data.data.messages,
                        updatedAt: new Date().toISOString()
                    });
                } else {
                    setConversations(data.data || []);
                }
            } else {
                setConversations(data.data || []);
            }
        } catch (error) {
            console.error("Error al cargar conversaciones:", error);
            throw error;
        }
    };

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

    // Función para mapear ID de estados de la API a los valores locales
    const mapApiStatusToLocalStatus = (statusId: string): string => {
        // En la base de datos probablemente los IDs son numéricos o tienen otro formato
        // Aquí mapeamos esos IDs a nuestros valores locales (pending, completed, rejected, all)
        const statusMap: Record<string, string> = {
            "1": "pending",
            "2": "completed",
            "3": "rejected",
            // Agrega más mapeos si es necesario
        };

        return statusMap[statusId] || statusId;
    };

    const getStatusColor = (status: string): string => {
        const statusId = mapApiStatusToLocalStatus(status);
        switch (statusId) {
            case "pending":
            case "1":
                return "bg-yellow-200 text-yellow-700 border border-yellow-300";
            case "rejected":
            case "3":
                return "bg-red-100 text-red-800";
            case "completed":
            case "2":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
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

    // Efecto para seleccionar una conversación específica cuando cambia specificClientId
    useEffect(() => {
        // Solo intentar seleccionar si hay un ID de cliente específico, hay conversaciones, y no es el mismo que ya se procesó
        if (specificClientId &&
            userRole === "MUSICIAN" &&
            conversations.length > 0 &&
            specificClientId !== processedClientId) {

            const matchingConversation = conversations.find(
                conv => conv.clientId === specificClientId
            );

            if (matchingConversation) {
                // Marcar este clientId como procesado para evitar ciclos
                setProcessedClientId(specificClientId);
                // Seleccionar la conversación
                handleSelectConversation(matchingConversation);
            }
        }
    }, [specificClientId, conversations, userRole, handleSelectConversation, processedClientId]);

    // Vista de Chats
    return (
        <div className="w-full">
            {!showOnlyChats && !useTableLayout && (
                <div className="mb-4">
                    <Tabs value={view} onValueChange={(value) => setView(value as 'chats' | 'reservations')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="chats">Mis Conversaciones</TabsTrigger>
                            <TabsTrigger value="reservations">Mis Reservaciones</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {/* Vista de Chats */}
            {(view === 'chats' && !useTableLayout) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Lista de conversaciones */}
                    <div className="md:col-span-1">
                        {showChatsHeader && <h2 className="text-xl font-bold mb-4">Mis Conversaciones</h2>}
                        <div className="space-y-2 max-w-[260px] max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <p className="text-center text-gray-500 my-8">Cargando conversaciones...</p>
                            ) : conversations.length > 0 ? conversations.map((conversation) => (
                                <Card
                                    key={conversation.id}
                                    className={`cursor-pointer hover:border-blue-500 transition-all ${selectedConversation?.id === conversation.id ||
                                        (specificClientId && conversation.clientId === specificClientId)
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400 shadow-md'
                                        : ''
                                        }`}
                                    onClick={() => handleSelectConversation(conversation)}
                                >
                                    <CardHeader className="p-2">
                                        <CardTitle className="text-sm">
                                            {userRole === "CLIENT"
                                                ? conversation.musicianName
                                                : conversation.clientName}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {new Date(conversation.updatedAt).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )) : (
                                <p className="text-center text-gray-500 my-8">
                                    No tienes conversaciones activas
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Detalle de la conversación */}
                    <div className="md:col-span-2">
                        {isProcessing ? (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border">
                                <p className="text-gray-500">Cargando conversación...</p>
                            </div>
                        ) : selectedConversation ? (
                            <Chat
                                clientId={selectedConversation.clientId}
                                musicianId={selectedConversation.musicianId}
                                clientName={selectedConversation.clientName}
                                musicianName={selectedConversation.musicianName}
                                onCreateReservationRequest={handleCreateReservation}
                            />
                        ) : (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border">
                                <p className="text-gray-500">Selecciona una conversación para ver los mensajes</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Vista de Reservaciones */}
            {((view === 'reservations' && !showOnlyChats && !useTableLayout) || useTableLayout) && (
                <>
                    {loading ? (
                        useTableLayout ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8">Cargando reservaciones...</td>
                            </tr>
                        ) : (
                            <div className="col-span-3 text-center py-8">Cargando reservaciones...</div>
                        )
                    ) : reservations.length === 0 ? (
                        useTableLayout ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8">No tienes reservaciones activas</td>
                            </tr>
                        ) : (
                            <div className="col-span-3 text-center py-8">No tienes reservaciones activas</div>
                        )
                    ) : (
                        // Mostrar las reservaciones según el rol del usuario
                        useTableLayout ? (
                            // Versión para tabla en la vista de perfil
                            <>
                                {getFilteredReservations().map((reservation) => (
                                    <tr key={reservation.id} className="border-b border-gray-200">
                                        <td className="px-4 py-2 text-sm">
                                            {userRole === "MUSICIAN" ? reservation.client.name : reservation.musician.name}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            {format(new Date(reservation.serviceDate), "dd/MM/yyyy")}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            ${Number(reservation.price).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <Badge className={getStatusColor(reservation.reservationstatus.id)}>
                                                {reservation.reservationstatus.name}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.location.href = `/chats?${userRole === "MUSICIAN" ? "clientId" : "musicianId"}=${userRole === "MUSICIAN" ? reservation.clientId : reservation.musicianId}`}
                                            >
                                                Ir al Chat
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ) : (
                            <div className="col-span-3">
                                <h2 className="text-xl font-bold mb-4">Mis Reservaciones</h2>
                                {/* Aquí iría la tabla o listado de reservaciones */}
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
} 