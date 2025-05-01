import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema para validar el mensaje enviado
const messageSchema = z.object({
    clientId: z.string(),
    musicianId: z.string(),
    content: z.string(),
    senderId: z.string(),
    senderType: z.enum(["CLIENT", "MUSICIAN"]).default("CLIENT")
});

// Estructura de mensaje en la conversación
interface MessageData {
    id: string;
    content: string;
    senderId: string;
    senderType: string;
    timestamp: string;
}

// GET: Obtener una conversación entre cliente y músico
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const musicianId = searchParams.get("musicianId");

        // Si se proporcionan ambos IDs, buscar una conversación específica
        if (clientId && musicianId) {
            // Buscar la conversación existente
            const conversation = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { clientId },
                        { musicianId }
                    ]
                },
                include: {
                    client: {
                        select: {
                            name: true,
                        }
                    },
                    musician: {
                        select: {
                            name: true,
                        }
                    }
                }
            });

            if (!conversation) {
                return NextResponse.json({
                    success: true,
                    data: {
                        messages: [],
                        clientName: null,
                        musicianName: null
                    }
                });
            }

            // Parsear los mensajes almacenados como JSON
            const messages = conversation.messages as unknown as MessageData[];

            return NextResponse.json({
                success: true,
                data: {
                    messages,
                    clientName: conversation.client.name,
                    musicianName: conversation.musician.name
                }
            });
        }
        // Si solo se proporciona clientId, buscar todas las conversaciones del cliente
        else if (clientId) {
            const conversations = await prisma.conversation.findMany({
                where: { clientId },
                include: {
                    client: {
                        select: {
                            name: true,
                        }
                    },
                    musician: {
                        select: {
                            name: true,
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });

            // Mapear las conversaciones para incluir solo información básica
            const formattedConversations = conversations.map(conv => {
                return {
                    id: conv.id,
                    clientId: conv.clientId,
                    musicianId: conv.musicianId,
                    clientName: conv.client.name,
                    musicianName: conv.musician.name,
                    updatedAt: conv.updatedAt
                };
            });

            return NextResponse.json({
                success: true,
                data: formattedConversations
            });
        }
        // Si solo se proporciona musicianId, buscar todas las conversaciones del músico
        else if (musicianId) {
            const conversations = await prisma.conversation.findMany({
                where: { musicianId },
                include: {
                    client: {
                        select: {
                            name: true,
                        }
                    },
                    musician: {
                        select: {
                            name: true,
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });

            // Mapear las conversaciones para incluir solo información básica
            const formattedConversations = conversations.map(conv => {
                return {
                    id: conv.id,
                    clientId: conv.clientId,
                    musicianId: conv.musicianId,
                    clientName: conv.client.name,
                    musicianName: conv.musician.name,
                    updatedAt: conv.updatedAt
                };
            });

            return NextResponse.json({
                success: true,
                data: formattedConversations
            });
        }
        // Si no se proporciona ningún ID, devolver error
        else {
            return NextResponse.json(
                { success: false, message: "Se requiere al menos clientId o musicianId" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error al obtener conversación:", error);
        return NextResponse.json(
            { success: false, message: "Error al obtener la conversación", error: String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect().catch(e => {
            console.error("Error al desconectar de Prisma:", e);
        });
    }
}

// POST: Agregar un mensaje a una conversación existente o crear una nueva
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Recibido en /api/conversations:", body);

        // Validar datos
        const result = messageSchema.safeParse(body);

        if (!result.success) {
            console.error("Error de validación:", result.error.format());
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { clientId, musicianId, content, senderId } = result.data;

        // Verificar que senderId sea igual a clientId o musicianId
        if (senderId !== clientId && senderId !== musicianId) {
            console.error(`Error de validación: senderId (${senderId}) debe ser igual a clientId (${clientId}) o musicianId (${musicianId})`);
            return NextResponse.json({
                success: false,
                message: "Error de validación: el remitente debe ser el cliente o el músico",
            }, { status: 400 });
        }

        // Determinar el tipo de remitente basado en el ID
        const derivedSenderType = senderId === clientId ? "CLIENT" : "MUSICIAN";

        // Verificar que los IDs de cliente y músico existen
        try {
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                select: { id: true, name: true }
            });

            if (!client) {
                console.error(`Cliente con ID ${clientId} no encontrado`);
                return NextResponse.json({
                    success: false,
                    message: "Cliente no encontrado"
                }, { status: 404 });
            }

            const musician = await prisma.musician.findUnique({
                where: { id: musicianId },
                select: { id: true, name: true }
            });

            if (!musician) {
                console.error(`Músico con ID ${musicianId} no encontrado`);
                return NextResponse.json({
                    success: false,
                    message: "Músico no encontrado"
                }, { status: 404 });
            }

            // Buscar una conversación existente o crear una nueva
            // Generar un ID único para el mensaje
            const messageId = crypto.randomUUID();

            // Crear objeto de mensaje
            const newMessage: MessageData = {
                id: messageId,
                content,
                senderId,
                senderType: derivedSenderType,
                timestamp: new Date().toISOString()
            };

            console.log("Buscando conversación existente...");
            const conversation = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { clientId },
                        { musicianId }
                    ]
                }
            });

            if (conversation) {
                console.log("Conversación encontrada, actualizando...");
                // Actualizar conversación existente
                const existingMessages: MessageData[] = JSON.parse(JSON.stringify(conversation.messages || []));
                existingMessages.push(newMessage);

                const updatedConversation = await prisma.conversation.update({
                    where: {
                        id: conversation.id
                    },
                    data: {
                        messages: JSON.parse(JSON.stringify(existingMessages)),
                        updatedAt: new Date()
                    }
                });

                console.log("Conversación actualizada:", updatedConversation.id);
                return NextResponse.json({
                    success: true,
                    message: "Mensaje agregado a la conversación",
                    data: newMessage
                }, { status: 200 });
            } else {
                console.log("Conversación no encontrada, creando nueva...");
                // Crear nueva conversación
                const newConversation = await prisma.conversation.create({
                    data: {
                        clientId,
                        musicianId,
                        messages: JSON.parse(JSON.stringify([newMessage]))
                    }
                });

                console.log("Nueva conversación creada:", newConversation.id);
                return NextResponse.json({
                    success: true,
                    message: "Nueva conversación creada",
                    data: newMessage
                }, { status: 201 });
            }

        } catch (error) {
            console.error("Error al guardar mensaje en la conversación:", error);
            return NextResponse.json({
                success: false,
                message: "Error al guardar el mensaje",
                error: String(error)
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error general en api/conversations:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud",
            error: String(error)
        }, { status: 500 });
    } finally {
        await prisma.$disconnect().catch(e => {
            console.error("Error al desconectar de Prisma:", e);
        });
    }
} 