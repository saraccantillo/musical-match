import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface ConversationData {
    id: string;
    clientId: string;
    musicianId: string;
    updatedAt: Date;
    messages: unknown;
    client: { name: string };
    musician: { name: string };
}

interface MessageData {
    id: string;
    content: string;
    senderId: string;
    senderType: string;
    timestamp: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const musicianId = searchParams.get("musicianId");

        if (!clientId && !musicianId) {
            return NextResponse.json(
                { success: false, message: "Se requiere clientId o musicianId" },
                { status: 400 }
            );
        }

        // Buscar conversaciones en la nueva tabla conversation
        let conversations: ConversationData[] = [];

        if (clientId) {
            // Buscar todas las conversaciones de un cliente
            conversations = await prisma.conversation.findMany({
                where: { clientId },
                include: {
                    client: {
                        select: { name: true }
                    },
                    musician: {
                        select: { name: true }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });
        } else if (musicianId) {
            // Buscar todas las conversaciones de un músico
            conversations = await prisma.conversation.findMany({
                where: { musicianId },
                include: {
                    client: {
                        select: { name: true }
                    },
                    musician: {
                        select: { name: true }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });
        }

        // Formatear la respuesta para incluir el último mensaje
        const formattedConversations = conversations.map(conversation => {
            const messages = conversation.messages as MessageData[];
            const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

            return {
                id: conversation.id,
                clientId: conversation.clientId,
                musicianId: conversation.musicianId,
                clientName: conversation.client.name,
                musicianName: conversation.musician.name,
                lastMessage: lastMessage ? lastMessage.content : "",
                timestamp: lastMessage ? lastMessage.timestamp : conversation.updatedAt
            };
        });

        return NextResponse.json({ success: true, data: formattedConversations });
    } catch (error) {
        console.error("Error al obtener conversaciones:", error);
        return NextResponse.json(
            { success: false, message: "Error al obtener las conversaciones" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect().catch(e => {
            console.error("Error al desconectar Prisma:", e);
        });
    }
} 