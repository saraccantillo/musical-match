import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");
        const musicianId = searchParams.get("musicianId");

        if (!clientId || !musicianId) {
            return NextResponse.json(
                { success: false, message: "Se requieren IDs de cliente y músico" },
                { status: 400 }
            );
        }

        // Buscar reserva entre el cliente y el músico
        const reservation = await prisma.reservation.findFirst({
            where: {
                clientId: clientId,
                musicianId: musicianId,
                reservationstatus: {
                    name: {
                        not: "Pendiente"
                    }
                }
            },
            include: {
                reservationstatus: true
            }
        });

        return NextResponse.json({
            success: true,
            exists: !!reservation,
            status: reservation?.reservationstatus.name || null
        });
    } catch (error) {
        console.error("Error al verificar reservas:", error);
        return NextResponse.json(
            { success: false, message: "Error al verificar reservas" },
            { status: 500 }
        );
    }
} 