import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Obtener el músico específico con todas sus relaciones
        const musician = await prisma.musician.findUnique({
            where: { id },
            include: {
                musiciangenre: {
                    include: {
                        musicalgenre: true,
                    },
                },
                musicianinstrument: {
                    include: {
                        instrument: true,
                    },
                },
                musicianevent: {
                    include: {
                        event: true,
                    },
                },
                media: true,
                review: true,
            },
        });

        if (!musician) {
            return NextResponse.json(
                { error: "Músico no encontrado" },
                { status: 404 }
            );
        }

        // Calcular el rating promedio
        const avgRating = musician.review?.length
            ? musician.review.reduce(
                (sum: number, review: { calificacion: number }) =>
                    sum + review.calificacion,
                0
            ) / musician.review.length
            : 0;

        // Usar el precio real del músico o uno predeterminado
        const minPrice = musician.minPrice ? Number(musician.minPrice) : 200000;
        const maxPrice = musician.maxPrice ? Number(musician.maxPrice) : 500000;

        // Formatear los datos del músico
        const formattedMusician = {
            id: musician.id,
            name: musician.name,
            email: musician.email,
            phone: musician.phone,
            image: musician.media[0]?.filePath || '/images/profile.jpg',
            rating: avgRating || 4.5,
            totalReviews: musician.review?.length || 0,
            price: `$${(minPrice / 1000).toFixed(0)}k - $${(maxPrice / 1000).toFixed(0)}k`,
            minPrice: minPrice,
            maxPrice: maxPrice,
            location: 'Colombia',
            genre: musician.musiciangenre.map((mg: { musicalgenre: { name: string } }) => mg.musicalgenre.name),
            instrument: musician.musicianinstrument.map((mi: { instrument: { name: string } }) => mi.instrument.name).join(', '),
            events: musician.musicianevent.map((me: { event: { name: string } }) => me.event.name),
            availability: ['Fines de semana', 'Eventos privados'],
            description: "Músico profesional con experiencia en eventos sociales y corporativos."
        };

        return NextResponse.json(formattedMusician);
    } catch (error) {
        console.error("Error al obtener el músico:", error);
        return NextResponse.json(
            { error: "Error al obtener los datos del músico" },
            { status: 500 }
        );
    }
} 