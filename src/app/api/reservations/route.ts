import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Esquema para crear reserva desde prereservación
const createReservationSchema = z.object({
    clientId: z.string(),
    musicianId: z.string(),
    price: z.number(),
    serviceDate: z.string().or(z.date()),
    eventType: z.string().optional()
});

// Esquema para actualizar estado de reserva
const updateReservationSchema = z.object({
    id: z.string(),
    status: z.string()
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const musicianId = searchParams.get('musicianId');
        const id = searchParams.get('id');

        // Por ID específico
        if (id) {
            const reservation = await prisma.reservation.findUnique({
                where: { id },
                include: {
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
                    },
                    reservationstatus: true
                }
            });

            if (!reservation) {
                return NextResponse.json({
                    success: false,
                    message: "Reserva no encontrada"
                }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: reservation
            });
        }

        // Criterio de búsqueda
        if (!clientId && !musicianId) {
            return NextResponse.json({
                success: false,
                message: "Debe proporcionar clientId o musicianId como parámetro"
            }, { status: 400 });
        }

        const where: Record<string, string> = {};
        if (clientId) {
            where.clientId = clientId;
        }
        if (musicianId) {
            where['musicianId'] = musicianId;
        }

        const reservations = await prisma.reservation.findMany({
            where,
            include: {
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
                },
                reservationstatus: true
            },
            orderBy: {
                creationDate: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            data: reservations
        });

    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST - Crear una nueva reserva (a partir de una prereservación)
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validar datos
        const result = createReservationSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { clientId, musicianId, price, serviceDate, eventType } = result.data;

        // Buscar status "pending"
        const pendingStatus = await prisma.reservationstatus.findFirst({
            where: { name: 'Pendiente' }
        });

        if (!pendingStatus) {
            return NextResponse.json({
                success: false,
                message: "No se pudo encontrar el estado 'Pendiente'"
            }, { status: 500 });
        }

        // Crear la reserva con estado pendiente
        const reservation = await prisma.reservation.create({
            data: {
                clientId,
                musicianId,
                price,
                serviceDate: new Date(serviceDate),
                reservationStatusId: pendingStatus.id
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
                },
                reservationstatus: true
            }
        });

        // Enviar mensaje de confirmación a la conversación
        if (reservation.id) {
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
                content: `✅ *RESERVA CONFIRMADA*\n\nLa reserva ha sido creada correctamente.\nID: ${reservation.id}\nFecha: ${new Date(serviceDate).toLocaleDateString()}\nPrecio: COP $${price.toLocaleString()}\n${eventType ? `Tipo de evento: ${eventType}` : ''}`,
                timestamp: new Date(),
                senderId: "SYSTEM",
                senderType: "SYSTEM",
                reservationId: reservation.id
            };

            if (conversation) {
                // Actualizar conversación existente
                const existingMessages = JSON.parse(JSON.stringify(conversation.messages || []));
                existingMessages.push(newMessage);

                await prisma.conversation.update({
                    where: {
                        id: conversation.id
                    },
                    data: {
                        messages: JSON.parse(JSON.stringify(existingMessages)),
                        updatedAt: new Date()
                    }
                });
            } else {
                // Crear nueva conversación con el mensaje
                await prisma.conversation.create({
                    data: {
                        clientId,
                        musicianId,
                        messages: JSON.parse(JSON.stringify([newMessage]))
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Reserva creada correctamente",
            data: reservation
        }, { status: 201 });

    } catch (error) {
        console.error('Error al crear reserva:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// PATCH - Actualizar estado de reserva
export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        // Validar datos
        const result = updateReservationSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { id, status } = result.data;

        // Verificar que la reserva existe
        const reservation = await prisma.reservation.findUnique({
            where: { id }
        });

        if (!reservation) {
            return NextResponse.json({
                success: false,
                message: "Reserva no encontrada"
            }, { status: 404 });
        }

        // Verificar que el estado es válido
        const validStatus = await prisma.reservationstatus.findFirst({
            where: { id: status }
        });

        if (!validStatus) {
            return NextResponse.json({
                success: false,
                message: "Estado no válido"
            }, { status: 400 });
        }

        // Actualizar estado de la reserva
        const updatedReservation = await prisma.reservation.update({
            where: { id },
            data: {
                reservationStatusId: status
            },
            include: {
                client: {
                    select: {
                        name: true,
                        id: true
                    }
                },
                musician: {
                    select: {
                        name: true,
                        id: true
                    }
                },
                reservationstatus: true
            }
        });

        // Notificar el cambio de estado a través de un mensaje en la conversación
        const clientId = updatedReservation.clientId;
        const musicianId = updatedReservation.musicianId;

        let messageContent = "";
        if (validStatus.name === "Aceptada") {
            messageContent = `✅ *RESERVA ACEPTADA*\n\nEl músico ha aceptado tu reserva.\nID: ${id}\nFecha: ${updatedReservation.serviceDate.toLocaleDateString()}\nPrecio: COP $${updatedReservation.price.toString()}`;
        } else if (validStatus.name === "Rechazada") {
            messageContent = `❌ *RESERVA RECHAZADA*\n\nEl músico ha rechazado tu reserva.\nID: ${id}`;
        } else if (validStatus.name === "Completada") {
            messageContent = `🎉 *RESERVA COMPLETADA*\n\nLa reserva ha sido marcada como completada.\nID: ${id}`;
        }

        if (messageContent) {
            // Buscar conversación existente
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
                content: messageContent,
                timestamp: new Date(),
                senderId: "SYSTEM",
                senderType: "SYSTEM",
                reservationId: id
            };

            if (conversation) {
                // Actualizar conversación existente
                const existingMessages = JSON.parse(JSON.stringify(conversation.messages || []));
                existingMessages.push(newMessage);

                await prisma.conversation.update({
                    where: {
                        id: conversation.id
                    },
                    data: {
                        messages: JSON.parse(JSON.stringify(existingMessages)),
                        updatedAt: new Date()
                    }
                });
            } else {
                // Crear nueva conversación con el mensaje
                await prisma.conversation.create({
                    data: {
                        clientId,
                        musicianId,
                        messages: JSON.parse(JSON.stringify([newMessage]))
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Estado actualizado correctamente",
            data: updatedReservation
        });

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 