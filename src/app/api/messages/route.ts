import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Esquema para validar los mensajes enviados
const messageSchema = z.object({
    clientId: z.string(),
    musicianId: z.string(),
    content: z.string(),
    senderId: z.string(),
    senderType: z.enum(["CLIENT", "MUSICIAN"]).default("CLIENT")
});

// Interfaces para el manejo de mensajes dentro de conversations
interface MessageData {
    id: string;
    clientId: string;
    musicianId: string;
    content: string;
    timestamp: Date;
    senderId: string;
    senderType: string;
}

// Guardar un nuevo mensaje
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Recibido en /api/messages:", body);

        // Validar datos
        const result = messageSchema.safeParse(body);

        if (!result.success) {
            console.error("Error de validación:", result.error.format());
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { clientId, musicianId, content, senderId, senderType } = result.data;

        // Verificar que senderId sea igual a clientId o musicianId
        if (senderId !== clientId && senderId !== musicianId) {
            console.error(`Error de validación: senderId (${senderId}) debe ser igual a clientId (${clientId}) o musicianId (${musicianId})`);
            return NextResponse.json({
                success: false,
                message: "Error de validación: el remitente debe ser el cliente o el músico",
            }, { status: 400 });
        }

        // Validar que senderType coincida con senderId
        const derivedSenderType = senderId === clientId ? "CLIENT" : "MUSICIAN";
        if (senderType !== derivedSenderType) {
            console.error(`Error de validación: senderType (${senderType}) no coincide con el tipo de remitente (${derivedSenderType})`);
        }

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

            // Buscar o crear conversación
            const conversation = await prisma.conversation.findFirst({
                where: {
                    clientId,
                    musicianId
                }
            });

            const messageId = crypto.randomUUID();
            const newMessage: MessageData = {
                id: messageId,
                clientId,
                musicianId,
                content,
                timestamp: new Date(),
                senderId,
                senderType: derivedSenderType
            };

            if (conversation) {
                // Actualizar conversación existente
                const existingMessages = JSON.parse(JSON.stringify(conversation.messages || [])) as MessageData[];
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

                console.log("Mensaje agregado a conversación existente:", updatedConversation.id);

                return NextResponse.json({
                    success: true,
                    message: "Mensaje enviado correctamente",
                    data: {
                        ...newMessage,
                        clientName: client.name,
                        musicianName: musician.name
                    }
                }, { status: 201 });
            } else {
                // Crear nueva conversación
                const newConversation = await prisma.conversation.create({
                    data: {
                        clientId,
                        musicianId,
                        messages: JSON.parse(JSON.stringify([newMessage])),
                    },
                    include: {
                        client: {
                            select: {
                                name: true
                            }
                        },
                        musician: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                console.log("Nueva conversación creada:", newConversation.id);

                return NextResponse.json({
                    success: true,
                    message: "Mensaje enviado correctamente",
                    data: {
                        ...newMessage,
                        clientName: client.name,
                        musicianName: musician.name
                    }
                }, { status: 201 });
            }
        } catch (error) {
            console.error("Error al procesar el mensaje:", error);
            return NextResponse.json({
                success: false,
                message: "Error al guardar el mensaje",
                error: String(error)
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error general en api/messages:', error);
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

// Obtener mensajes
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const musicianId = searchParams.get("musicianId");

        if (!clientId || !musicianId) {
            return NextResponse.json(
                { success: false, message: "Se requieren clientId y musicianId" },
                { status: 400 }
            );
        }

        // Obtener conversación entre cliente y músico
        const conversation = await prisma.conversation.findFirst({
            where: {
                clientId,
                musicianId
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
            return NextResponse.json({ success: true, data: [] });
        }

        const messages = (conversation.messages as unknown) as MessageData[];
        const formattedMessages = messages.map(message => ({
            ...message,
            clientName: conversation.client.name,
            musicianName: conversation.musician.name
        }));

        return NextResponse.json({ success: true, data: formattedMessages });
    } catch (error) {
        console.error("Error al obtener mensajes:", error);
        return NextResponse.json(
            { success: false, message: "Error al obtener los mensajes" },
            { status: 500 }
        );
    }
} 