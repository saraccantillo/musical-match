"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ReservationData } from "./reservation-form";

interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    senderName?: string;
    senderType: "client" | "musician";
}

interface ChatProps {
    clientId: string;
    musicianId: string;
    clientName: string;
    musicianName: string;
    reservationData?: ReservationData;
    onCreateReservationRequest?: (clientId: string, musicianId: string, reservationData: ReservationData) => void;
}

// Interfaz para los mensajes recibidos de la API
interface ApiMessage {
    id: string;
    content: string;
    senderId: string;
    senderType: string;
    timestamp: string;
}

// Interfaz para la respuesta de la API de conversaciones
interface ConversationResponse {
    messages: ApiMessage[];
    clientName: string;
    musicianName: string;
}

export function Chat({
    clientId,
    musicianId,
    clientName,
    musicianName,
    reservationData,
    onCreateReservationRequest
}: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [userRole, setUserRole] = useState<"CLIENT" | "MUSICIAN" | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPrereservation, setIsPrereservation] = useState(false);
    const [initialMessageSent, setInitialMessageSent] = useState(false);
    const [hasReservation, setHasReservation] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);

    // Efecto para cargar los datos del usuario
    useEffect(() => {
        const storedRole = localStorage.getItem("userRole") as "CLIENT" | "MUSICIAN" | null;
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
            }
        }
    }, []);

    // Determinar si estamos en modo prereservación
    useEffect(() => {
        setIsPrereservation(!!reservationData);
    }, [reservationData]);

    // Función para verificar mensajes de aceptación
    const checkForAcceptanceMessage = useCallback((messages: Message[]): boolean => {
        return messages.some(msg => {
            const content = msg.content.toLowerCase();
            return (
                content.includes("solicitud aceptada") ||
                content.includes("*solicitud aceptada*") ||
                content.includes("✅ *solicitud aceptada*") ||
                (content.includes("aceptado") && content.includes("reserva")) ||
                (content.includes("reserva") && content.includes("creada"))
            );
        });
    }, []);

    // Enviar mensaje a la API con useCallback
    const sendMessageToApi = useCallback(async (content: string, senderIdValue?: string) => {
        if (!content.trim() || !userRole) return false;

        try {
            const payload = {
                clientId,
                musicianId,
                content,
                senderId: senderIdValue || (userRole === "CLIENT" ? clientId : musicianId),
                senderType: userRole
            };

            console.log('Enviando mensaje a la API:', payload);

            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Error desconocido" }));
                console.error('Error al enviar mensaje:', errorData);
                throw new Error(errorData.message || 'Error al enviar mensaje');
            }

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error en sendMessageToApi:', error);
            return false;
        }
    }, [clientId, musicianId, userRole]);

    // Cargar mensajes por usuarios con useCallback
    const loadMessagesByUsers = useCallback(async () => {
        if (!clientId || !musicianId || !userId) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/conversations?clientId=${clientId}&musicianId=${musicianId}`);
            if (!response.ok) {
                throw new Error('Error obteniendo mensajes');
            }

            const data = await response.json();

            if (data.success && data.data) {
                const conversationData = data.data as ConversationResponse;
                const apiMessages = conversationData.messages || [];

                // Verificar si existe una reserva entre estos usuarios
                const checkReservation = await fetch(`/api/reservations/check?clientId=${clientId}&musicianId=${musicianId}`);
                if (checkReservation.ok) {
                    const reservationData = await checkReservation.json();
                    console.log("Datos de reserva:", reservationData);

                    // Verificar si existe una reservación y su estado
                    const reservationExists = reservationData.exists;
                    const reservationStatus = reservationData.status || '';
                    console.log("Estado de reserva:", reservationStatus);

                    // Si hay una reserva y su estado no es pendiente, actualizar la UI
                    const hasReserv = reservationExists && (reservationStatus !== 'pending' && reservationStatus !== 'Pendiente');
                    const isAccept = reservationExists && (reservationStatus === 'Aceptada' || reservationStatus === 'Completada');

                    console.log("Actualizando estados - hasReservation:", hasReserv, "isAccepted:", isAccept);

                    if (hasReserv) {
                        setHasReservation(true);
                    }

                    if (isAccept) {
                        setIsAccepted(true);
                    }
                }

                const formattedMessages = apiMessages.map((msg: ApiMessage) => {
                    // Asegurarse que senderType sea siempre "client" o "musician"
                    const senderTypeFormatted = msg.senderType.toLowerCase() === "client" ? "client" : "musician";

                    return {
                        id: msg.id,
                        senderId: msg.senderId,
                        receiverId: msg.senderId === clientId ? musicianId : clientId,
                        content: msg.content,
                        timestamp: new Date(msg.timestamp),
                        senderName: msg.senderId === clientId ? conversationData.clientName : conversationData.musicianName,
                        senderType: senderTypeFormatted as "client" | "musician"
                    };
                });

                if (formattedMessages.length > 0) {
                    setMessages(formattedMessages);

                    // Verificar si hay un mensaje de aceptación en los mensajes
                    // Usamos una función más robusta para detectar mensajes de aceptación
                    const hasAcceptedMessage = checkForAcceptanceMessage(formattedMessages);

                    if (hasAcceptedMessage) {
                        console.log("Se encontró un mensaje de aceptación, actualizando isAccepted a true");
                        setIsAccepted(true);
                        setHasReservation(true);
                    }

                    setIsPrereservation(true);
                }
            }
        } catch (error) {
            console.error('Error al cargar mensajes por usuarios:', error);
        } finally {
            setIsLoading(false);
        }
    }, [clientId, musicianId, userId, checkForAcceptanceMessage]);

    // Efecto para cargar mensajes desde la API o crear mensaje inicial para prereservación
    useEffect(() => {
        const fetchMessages = async () => {
            // Si tenemos datos de reservación y el usuario es cliente, enviar mensaje de solicitud
            if (reservationData && userRole === "CLIENT" && userId && !initialMessageSent) {
                setInitialMessageSent(true);

                try {
                    // Crear mensaje de solicitud de reserva
                    const reservationMessage = createReservationMessage(reservationData);
                    // Enviar mensaje de solicitud
                    await sendMessageToApi(reservationMessage);

                    // Cargar la conversación después de enviar mensaje
                    await loadMessagesByUsers();
                } catch (error) {
                    console.error("Error al guardar mensaje inicial:", error);
                }
            }
            // Cualquier otro caso, cargamos mensajes por usuarios
            else if (clientId && musicianId) {
                loadMessagesByUsers();
            }
        };

        if (userId && ((reservationData && userRole === "CLIENT") || (clientId && musicianId))) {
            fetchMessages();
        }
    }, [userId, userRole, clientId, musicianId, reservationData, initialMessageSent, loadMessagesByUsers, sendMessageToApi]);

    // Auto-scroll cuando se añaden nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Configurar un intervalo para actualizar los mensajes periódicamente
    useEffect(() => {
        if (!userId) return;

        const refreshMessages = async () => {
            try {
                if (clientId && musicianId) {
                    const url = `/api/conversations?clientId=${clientId}&musicianId=${musicianId}`;

                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Error obteniendo mensajes');
                    }

                    const data = await response.json();

                    if (data.success && data.data) {
                        const conversationData = data.data as ConversationResponse;
                        const apiMessages = conversationData.messages || [];

                        // Verificar también si existe una reserva actualizada
                        const checkReservation = await fetch(`/api/reservations/check?clientId=${clientId}&musicianId=${musicianId}`);
                        if (checkReservation.ok) {
                            const reservationData = await checkReservation.json();
                            const reservationExists = reservationData.exists;
                            const reservationStatus = reservationData.status || '';

                            console.log("Estado actual de reserva durante refresh:", reservationStatus);
                            console.log("Estado actual de isAccepted:", isAccepted);

                            // Actualizar los estados de UI basados en el estado de la reserva
                            if (reservationExists && (reservationStatus !== 'pending' && reservationStatus !== 'Pendiente')) {
                                setHasReservation(true);
                            }

                            if (reservationExists && (reservationStatus === 'Aceptada' || reservationStatus === 'Completada')) {
                                setIsAccepted(true);
                            }
                        }

                        const formattedMessages = apiMessages.map((msg: ApiMessage) => {
                            // Asegurarse que senderType sea siempre "client" o "musician"
                            const senderTypeFormatted = msg.senderType.toLowerCase() === "client" ? "client" : "musician";

                            return {
                                id: msg.id,
                                senderId: msg.senderId,
                                receiverId: msg.senderId === clientId ? musicianId : clientId,
                                content: msg.content,
                                timestamp: new Date(msg.timestamp),
                                senderName: msg.senderId === clientId ? conversationData.clientName : conversationData.musicianName,
                                senderType: senderTypeFormatted as "client" | "musician"
                            };
                        });

                        // Verificar si hay mensajes de aceptación nuevos
                        if (formattedMessages.length > 0 && !isAccepted) {
                            const hasAcceptedMessage = checkForAcceptanceMessage(formattedMessages);
                            if (hasAcceptedMessage) {
                                console.log("Mensaje de aceptación detectado durante refresh, actualizando isAccepted");
                                setIsAccepted(true);
                                setHasReservation(true);
                            }
                        }

                        // Solo actualizar si hay nuevos mensajes
                        if (formattedMessages.length !== messages.length) {
                            setMessages(formattedMessages);
                        }
                    }
                }
            } catch (error) {
                console.error('Error al actualizar mensajes:', error);
            }
        };

        // Ejecutar inmediatamente
        refreshMessages();

        // Actualizar cada 5 segundos
        const intervalId = setInterval(refreshMessages, 5000);

        // Limpiar intervalo al desmontar
        return () => clearInterval(intervalId);
    }, [userId, messages.length, clientId, musicianId, isAccepted, checkForAcceptanceMessage]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !userRole) return;

        // Determinar quién envía el mensaje según el rol del usuario
        const senderIsClient = userRole === "CLIENT";
        const currentSenderId = senderIsClient ? clientId : musicianId;

        const message: Message = {
            id: Date.now().toString(),
            senderId: currentSenderId,
            receiverId: senderIsClient ? musicianId : clientId,
            content: newMessage,
            timestamp: new Date(),
            senderName: senderIsClient ? clientName : musicianName,
            senderType: senderIsClient ? "client" : "musician"
        };

        // Agregar mensaje localmente para UX inmediata
        setMessages(prev => [...prev, message]);
        setNewMessage("");

        // Enviar mensaje a la API - asegurarnos de pasar el senderId correcto
        const success = await sendMessageToApi(message.content, currentSenderId);

        if (!success) {
            alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
            // Opcionalmente, podríamos quitar el último mensaje de la lista si falló el envío
            // setMessages(prev => prev.slice(0, -1));
        }
    };

    // Determinar si se debe mostrar el botón de aceptar solicitud (solo para músicos y solo en prereservación)
    const showAcceptButton = userRole === "MUSICIAN" && isPrereservation && !isAccepted && messages.length > 0;

    // Función para extraer datos de reservación a partir del primer mensaje
    const extractReservationDataFromMessage = (): ReservationData | null => {
        if (messages.length === 0) return null;

        // Buscar el primer mensaje que parece ser una solicitud de reserva
        const reservationMessage = messages.find(msg =>
            msg.content.includes("*SOLICITUD DE RESERVA*") ||
            msg.content.includes("Tipo de evento")
        );

        if (!reservationMessage) return null;

        try {
            // Extraer datos del mensaje
            const content = reservationMessage.content;

            // Extraer tipo de evento
            const eventTypeMatch = content.match(/Tipo de evento: ([^\n]+)/);
            const eventType = eventTypeMatch ? eventTypeMatch[1].trim() : "No especificado";

            // Extraer fecha
            const dateMatch = content.match(/Fecha: ([^\n]+)/);
            let eventDate = new Date().toISOString().split('T')[0]; // Default a hoy
            if (dateMatch) {
                const dateStr = dateMatch[1].trim();
                const dateParts = dateStr.split('/');
                if (dateParts.length === 3) {
                    eventDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                }
            }

            // Extraer precio
            const priceMatch = content.match(/Precio inicial: COP \$([0-9,]+)/);
            const initialPrice = priceMatch
                ? Number(priceMatch[1].replace(/,/g, ''))
                : 200000;

            // Extraer ubicación
            const locationMatch = content.match(/Ubicación: ([^\n]+)/);
            let city = "No especificada";
            let department = "No especificado";
            if (locationMatch) {
                const locationParts = locationMatch[1].split(',');
                if (locationParts.length >= 1) city = locationParts[0].trim();
                if (locationParts.length >= 2) department = locationParts[1].trim();
            }

            // Extraer dirección
            const addressMatch = content.match(/Dirección: ([^\n]+)/);
            const address = addressMatch ? addressMatch[1].trim() : "No especificada";

            // Extraer comentarios
            const commentsMatch = content.match(/Comentarios adicionales: ([^\n]+)/);
            const comments = commentsMatch ? commentsMatch[1].trim() : "";

            // Crear objeto de datos de reserva
            return {
                eventType,
                eventDate,
                initialPrice,
                location: {
                    city,
                    department
                },
                address,
                comments
            };
        } catch (error) {
            console.error("Error al extraer datos de reserva del mensaje:", error);
            return null;
        }
    };

    const handleCreateReservationRequest = async () => {
        console.log("Botón Aceptar Solicitud presionado");

        // Obtener datos de reserva del mensaje o usar los proporcionados
        const dataToUse = reservationData || extractReservationDataFromMessage();

        console.log("Datos para crear reserva:", dataToUse);

        if (onCreateReservationRequest && userRole === "MUSICIAN" && dataToUse) {
            try {
                console.log("Iniciando proceso de aceptación de solicitud...");

                // IMPORTANTE: Forzar la actualización del estado inmediatamente para cambiar la UI
                // antes de cualquier operación asíncrona
                setIsAccepted(true);
                setHasReservation(true);

                // Enviar un mensaje automático informando que se ha aceptado la solicitud y creado la reserva
                const acceptMessage = `✅ *SOLICITUD ACEPTADA*\n\nHe aceptado tu solicitud de reserva. La reserva ha sido creada correctamente.\nPuedes revisar los detalles en la sección "Mis Reservas".\nFecha: ${format(new Date(dataToUse.eventDate), "dd/MM/yyyy")}\nPrecio: COP $${dataToUse.initialPrice.toLocaleString()}`;

                // Agregar mensaje localmente para UX inmediata
                const message: Message = {
                    id: Date.now().toString(),
                    senderId: musicianId,
                    receiverId: clientId,
                    content: acceptMessage,
                    timestamp: new Date(),
                    senderName: musicianName,
                    senderType: "musician"
                };

                setMessages(prev => [...prev, message]);

                // Enviar mensaje a la API
                const messageSent = await sendMessageToApi(acceptMessage, musicianId);
                console.log("Mensaje enviado:", messageSent);

                // Invocar la función para crear la reservación
                console.log("Creando reservación...");
                const result = await onCreateReservationRequest(clientId, musicianId, dataToUse);
                console.log("Resultado de creación:", result);

                console.log("Solicitud aceptada con éxito");

                // Asegurar que los estados estén correctamente actualizados
                setIsAccepted(true);
                setHasReservation(true);

                // Refrescar los datos para asegurar que todo está actualizado
                await loadMessagesByUsers();

                alert("¡Has aceptado la solicitud con éxito! La reserva ha sido creada.");
            } catch (error) {
                console.error("Error al crear la reservación:", error);
                // En caso de error, revertir los cambios de estado
                setIsAccepted(false);
                setHasReservation(false);
                alert("Hubo un problema al aceptar la solicitud. Por favor, intenta nuevamente.");
            }
        } else {
            console.error("No se cumplen las condiciones para aceptar la solicitud");
            if (!onCreateReservationRequest) console.error("- No hay función onCreateReservationRequest");
            if (userRole !== "MUSICIAN") console.error(`- El rol no es MUSICIAN, es: ${userRole}`);
            if (!dataToUse) console.error("- No hay datos para crear la reserva");

            alert("No se pudo crear la reservación. Faltan datos necesarios.");
        }
    };

    const createReservationMessage = (data: ReservationData): string => {
        return `
📅 *SOLICITUD DE RESERVA*
            
Tipo de evento: ${data.eventType}
Fecha: ${format(new Date(data.eventDate), "dd/MM/yyyy")}
Ubicación: ${data.location.city}, ${data.location.department}
Dirección: ${data.address}
            
Precio inicial: COP $${data.initialPrice.toLocaleString()}
            
Comentarios adicionales: ${data.comments || "Ninguno"}
        `;
    };

    // Determinar quién es el otro usuario en la conversación según el rol
    const otherUserName = userRole === "CLIENT" ? musicianName : clientName;

    // Debug para verificar el valor de isAccepted
    console.log("Renderizando componente chat, isAccepted:", isAccepted, "isPrereservation:", isPrereservation, "hasReservation:", hasReservation);

    return (
        <div className="flex flex-col h-[600px] bg-white border rounded-lg shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b">
                <h3 className="text-lg font-semibold">Chat con {otherUserName}</h3>
                {isPrereservation ? (
                    <p className="text-sm text-gray-500">Coordina los detalles de tu reserva</p>
                ) : (
                    <p className="text-sm text-gray-500">Conversa con el {userRole === "CLIENT" ? "músico" : "cliente"}</p>
                )}

                {/* Mostrar indicador de prereservación - SOLO si no está aceptada aún */}
                {isPrereservation && !isAccepted && (
                    <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-yellow-600 font-medium">
                            ⚠️ {userRole === "CLIENT"
                                ? "Esperando respuesta del músico"
                                : "Solicitud de reserva pendiente"}
                        </span>

                        {/* Mostrar botón de aceptar SOLO para músicos */}
                        {showAcceptButton && (
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Botón Aceptar Solicitud clicked");
                                    handleCreateReservationRequest();
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <ThumbsUp className="mr-2 h-4 w-4" /> Aceptar Solicitud
                            </Button>
                        )}
                    </div>
                )}

                {/* Mostrar mensaje cuando la solicitud fue aceptada */}
                {isAccepted && (
                    <div className="mt-2">
                        <span className="text-sm text-green-600 font-medium">
                            ✅ Solicitud aceptada, puede revisar la reserva en &quot;Mis Reservas&quot;
                        </span>
                    </div>
                )}

                {/* Mostrar notificación de chat cerrado si hay una reserva confirmada pero no mostrar cuando ya se está mostrando el mensaje de aceptación */}
                {hasReservation && !isAccepted && (
                    <div className="mt-2">
                        <span className="text-sm text-blue-600 font-medium">
                            ℹ️ Este chat está asociado a una reserva confirmada. No se pueden enviar más mensajes.
                        </span>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">Cargando mensajes...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No hay mensajes aún. ¡Inicia la conversación!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        // Determinar si el mensaje actual es del usuario logueado
                        const isCurrentUser = userRole === "CLIENT" ?
                            message.senderId === clientId :
                            message.senderId === musicianId;

                        return (
                            <div
                                key={message.id}
                                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} gap-3 max-w-[80%]`}
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>
                                            {message.senderName?.charAt(0) || (isCurrentUser ? "Y" : "O")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div
                                            className={`rounded-lg px-4 py-3 ${isCurrentUser
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap">{message.content}</div>
                                        </div>
                                        <div
                                            className={`text-xs mt-1.5 ${isCurrentUser ? "text-right" : "text-left"} text-gray-500`}
                                        >
                                            {format(message.timestamp, "HH:mm • dd MMM")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        placeholder={hasReservation || isAccepted ? "Chat cerrado por reserva confirmada" : "Escribe un mensaje..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !hasReservation && !isAccepted && handleSendMessage()}
                        className="border-gray-300"
                        disabled={hasReservation || isAccepted}
                    />
                    <Button
                        onClick={handleSendMessage}
                        className="px-3 bg-blue-500 hover:bg-blue-600"
                        disabled={!newMessage.trim() || hasReservation || isAccepted}
                    >
                        <Send size={18} />
                    </Button>
                </div>
            </div>

            {userRole === "MUSICIAN" && reservationData && !hasReservation && !isAccepted && (
                <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">¿Aceptas crear una reservación con estas condiciones?</p>
                    <div className="flex gap-2">
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Botón Crear Reservación clicked");
                                handleCreateReservationRequest();
                            }}
                        >
                            Crear Reservación
                        </Button>
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                            Rechazar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}