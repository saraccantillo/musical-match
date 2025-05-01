import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        // Obtener todos los clientes
        const clients = await prisma.client.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: clients
        });
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        return NextResponse.json(
            { success: false, message: "Error al obtener la lista de clientes" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect().catch(e => {
            console.error("Error al desconectar Prisma:", e);
        });
    }
} 