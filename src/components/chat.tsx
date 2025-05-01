"use client";

import { useState, useEffect, useRef } from "react";
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
    onAcceptPrereservation?: (clientId: string, musicianId: string) => void;
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
    onAcceptPrereservation
}: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [userRole, setUserRole] = useState<"CLIENT" | "MUSICIAN" | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPrereservation, setIsPrereservation] = useState(false);
    const [initialMessageSent, setInitialMessageSent] = useState(false);

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

    // Efecto para cargar mensajes desde la API o crear mensaje inicial para prereservación
    useEffect(() => {
        const fetchMessages = async () => {
            if (!userId) return;

            // Si hay datos de prereservación y es la primera vez (cliente)
            if (reservationData && !initialMessageSent && userRole === "CLIENT") {
                console.log("Verificando si ya existen mensajes entre cliente y músico");

                // Primero verificar si ya hay mensajes
                try {
                    const checkResponse = await fetch(`/api/conversations?clientId=${clientId}&musicianId=${musicianId}`);
                    if (checkResponse.ok) {
                        const checkData = await checkResponse.json();

                        // Si ya hay mensajes, no crear uno nuevo
                        if (checkData.success && checkData.data.messages && checkData.data.messages.length > 0) {
                            console.log("Ya existen mensajes, no se creará uno inicial");
                            loadMessagesByUsers();
                            setInitialMessageSent(true);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error al verificar mensajes existentes:', error);
                }

                // Si llegamos aquí, significa que no hay mensajes y debemos crear uno
                console.log("Creando mensaje inicial de reserva");
                const initialMessage: Message = {
                    id: Date.now().toString(),
                    senderId: clientId,
                    receiverId: musicianId,
                    content: createReservationMessage(reservationData),
                    timestamp: new Date(),
                    senderName: clientName,
                    senderType: "client"
                };

                setMessages([initialMessage]);

                // Intentar guardar el mensaje en el servidor
                try {
                    const success = await sendMessageToApi(initialMessage.content, clientId);
                    if (success) {
                        console.log("Mensaje inicial guardado en el servidor");
                        setInitialMessageSent(true);
                    } else {
                        console.error("No se pudo guardar el mensaje inicial");
                    }
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
    }, [userId, userRole, clientId, musicianId, reservationData, initialMessageSent]);

    // Cargar mensajes por usuarios
    const loadMessagesByUsers = async () => {
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
                    setIsPrereservation(true);
                }
            }
        } catch (error) {
            console.error('Error al cargar mensajes por usuarios:', error);
        } finally {
            setIsLoading(false);
        }
    };

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

        // Actualizar cada 5 segundos
        const intervalId = setInterval(refreshMessages, 5000);

        // Limpiar intervalo al desmontar
        return () => clearInterval(intervalId);
    }, [userId, messages.length, clientId, musicianId]);

    // Enviar mensaje a la API
    const sendMessageToApi = async (content: string, senderIdValue?: string) => {
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
    };

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

    const handleAcceptPrereservation = () => {
        if (onAcceptPrereservation && userRole === "MUSICIAN") {
            onAcceptPrereservation(clientId, musicianId);
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

    // Determinar si se debe mostrar el botón de aceptar solicitud (solo para músicos y solo en prereservación)
    const showAcceptButton = userRole === "MUSICIAN" && isPrereservation && messages.length > 0;

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

                {/* Mostrar indicador de prereservación */}
                {isPrereservation && (
                    <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-yellow-600 font-medium">
                            ⚠️ {userRole === "CLIENT"
                                ? "Esperando respuesta del músico"
                                : "Solicitud de reserva pendiente"}
                        </span>

                        {/* Mostrar botón de aceptar SOLO para músicos */}
                        {showAcceptButton && (
                            <Button
                                onClick={handleAcceptPrereservation}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <ThumbsUp className="mr-2 h-4 w-4" /> Aceptar Solicitud
                            </Button>
                        )}
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
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="border-gray-300"
                    />
                    <Button
                        onClick={handleSendMessage}
                        className="px-3 bg-blue-500 hover:bg-blue-600"
                        disabled={!newMessage.trim()}
                    >
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
} 