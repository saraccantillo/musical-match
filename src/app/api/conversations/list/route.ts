import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Estructura de mensaje en la conversación
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
        const specificClientId = searchParams.get("specificClientId");
        const specificMusicianId = searchParams.get("specificMusicianId");

        let whereClause = {};

        // Construir el where clause según los parámetros proporcionados
        if (clientId) {
            whereClause = { ...whereClause, clientId };

            // Si además hay un músico específico
            if (specificMusicianId) {
                whereClause = {
                    AND: [
                        { clientId },
                        { musicianId: specificMusicianId }
                    ]
                };
            }
        }
        else if (musicianId) {
            whereClause = { ...whereClause, musicianId };

            // Si además hay un cliente específico
            if (specificClientId) {
                whereClause = {
                    AND: [
                        { musicianId },
                        { clientId: specificClientId }
                    ]
                };
            }
        }
        else {
            // Si no hay ni clientId ni musicianId, devolver error
            return NextResponse.json(
                { success: false, message: "Se requiere al menos clientId o musicianId" },
                { status: 400 }
            );
        }

        // Consultar conversaciones
        const conversations = await prisma.conversation.findMany({
            where: whereClause,
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
            // Obtener al menos el último mensaje si existe
            let previewMessage = null;
            if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
                const messages = conv.messages as unknown as MessageData[];
                previewMessage = messages[messages.length - 1];
            }

            return {
                id: conv.id,
                clientId: conv.clientId,
                musicianId: conv.musicianId,
                clientName: conv.client.name,
                musicianName: conv.musician.name,
                updatedAt: conv.updatedAt,
                messages: previewMessage ? [previewMessage] : []
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedConversations
        });
    } catch (error) {
        console.error("Error al obtener lista de conversaciones:", error);
        return NextResponse.json(
            { success: false, message: "Error al obtener la lista de conversaciones", error: String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect().catch(e => {
            console.error("Error al desconectar de Prisma:", e);
        });
    }
} 