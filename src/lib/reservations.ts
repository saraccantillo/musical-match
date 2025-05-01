import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

// Función para obtener todos los estados de reserva disponibles
export async function getReservationStatuses() {
    const prisma = new PrismaClient();

    try {
        const statuses = await prisma.reservationstatus.findMany();
        return statuses;
    } catch (error) {
        console.error("Error al obtener estados de reserva:", error);
        return [];
    } finally {
        await prisma.$disconnect();
    }
}

// Función para obtener un estado de reserva por su nombre
export async function getReservationStatusByName(name: string) {
    const prisma = new PrismaClient();

    try {
        const status = await prisma.reservationstatus.findFirst({
            where: { name }
        });
        return status;
    } catch (error) {
        console.error(`Error al obtener estado de reserva '${name}':`, error);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

// Función para actualizar el estado de una reserva
export async function updateReservationStatus(reservationId: string, statusId: string) {
    const prisma = new PrismaClient();

    try {
        const updatedReservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: { reservationStatusId: statusId },
            include: {
                reservationstatus: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                musician: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return updatedReservation;
    } catch (error) {
        console.error(`Error al actualizar estado de reserva ID ${reservationId}:`, error);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

// Función para crear un mensaje en la conversación de una reserva
export async function createReservationMessage(
    clientId: string,
    musicianId: string,
    content: string,
    senderId: string = "SYSTEM",
    senderType: string = "SYSTEM",
    reservationId?: string
) {
    const prisma = new PrismaClient();

    try {
        // Buscar la conversación existente
        const conversation = await prisma.conversation.findFirst({
            where: {
                clientId,
                musicianId
            }
        });

        const messageId = crypto.randomUUID();
        const newMessage = {
            id: messageId,
            clientId,
            musicianId,
            content,
            timestamp: new Date(),
            senderId,
            senderType,
            reservationId
        };

        if (conversation) {
            // Actualizar conversación existente
            const existingMessages = JSON.parse(JSON.stringify(conversation.messages || []));
            existingMessages.push(newMessage);

            const updatedConversation = await prisma.conversation.update({
                where: {
                    id: conversation.id
                },
                data: {
                    messages: existingMessages,
                    updatedAt: new Date()
                }
            });

            return updatedConversation;
        } else {
            // Crear nueva conversación con el mensaje
            const newConversation = await prisma.conversation.create({
                data: {
                    clientId,
                    musicianId,
                    messages: [newMessage]
                }
            });

            return newConversation;
        }
    } catch (error) {
        console.error("Error al crear mensaje de reserva:", error);
        return null;
    } finally {
        await prisma.$disconnect();
    }
} 