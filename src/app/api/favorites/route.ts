import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema para validar la entrada de datos
const favoriteSchema = z.object({
    clientId: z.string(),
    musicianId: z.string(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validar datos
        const result = favoriteSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { clientId, musicianId } = result.data;

        // Verifica que se hayan proporcionado ambos IDs
        if (!clientId || !musicianId) {
            return NextResponse.json({ error: 'clientId y musicianId son requeridos' }, { status: 400 });
        }

        // Crea un nuevo registro en la tabla de favoritos
        const favorite = await prisma.favorite.create({
            data: {
                clientId,
                musicianId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Músico añadido a favoritos",
            data: favorite
        }, { status: 201 });
    } catch (error) {
        console.error("Error al añadir a favoritos:", error);
        return NextResponse.json({ error: 'Error al añadir a favoritos' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId"); // Obtén el ID del cliente de los parámetros de búsqueda

        if (!clientId) {
            return NextResponse.json({ error: 'clientId es requerido' }, { status: 400 });
        }

        // Obtén los músicos favoritos del cliente
        const favorites = await prisma.favorite.findMany({
            where: { clientId },
            include: {
                musician: {
                    select: {
                        id: true,
                        name: true,
                        media: true,
                    },
                },
            },
        });

        console.log(favorites)

        return NextResponse.json({
            success: true,
            data: favorites,
        }, { status: 200 });
    } catch (error) {
        console.error("Error al obtener favoritos:", error);
        return NextResponse.json({ error: 'Error al obtener favoritos' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { clientId, musicianId } = body;

        // Verifica que se hayan proporcionado ambos IDs
        if (!clientId || !musicianId) {
            return NextResponse.json({ error: 'clientId y musicianId son requeridos' }, { status: 400 });
        }

        // Elimina el registro de favoritos
        await prisma.favorite.deleteMany({
            where: {
                clientId,
                musicianId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Músico eliminado de favoritos",
        }, { status: 200 });
    } catch (error) {
        console.error("Error al eliminar de favoritos:", error);
        return NextResponse.json({ error: 'Error al eliminar de favoritos' }, { status: 500 });
    }
}
