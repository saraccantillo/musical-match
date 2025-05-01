import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Obtener todos los músicos con sus géneros, instrumentos y eventos
        const musicians = await prisma.musician.findMany({
            include: {
                musiciangenre: {
                    include: {
                        musicalgenre: true
                    }
                },
                musicianinstrument: {
                    include: {
                        instrument: true
                    }
                },
                musicianevent: {
                    include: {
                        event: true
                    }
                },
                media: true,
                review: true
            }
        });

        // Transformar los datos para que coincidan con el formato esperado por el frontend
        const formattedMusicians = musicians.map(musician => {
            // Calcular el rating promedio
            const avgRating = musician.review?.length
                ? musician.review.reduce((sum: number, review: { calificacion: number }) => sum + review.calificacion, 0) / musician.review.length
                : 0;

            // Usar el precio real del músico o uno predeterminado
            const minPrice = musician.minPrice ? Number(musician.minPrice) : 200000;
            const maxPrice = musician.maxPrice ? Number(musician.maxPrice) : 500000;

            return {
                id: musician.id,
                name: musician.name,
                image: musician.media[0]?.filePath || 'https://images.unsplash.com/photo-1549213783-8284d0336c4f?q=80&w=1470&auto=format&fit=crop',
                rating: avgRating || 4.5, // Valor por defecto si no hay reviews
                price: `$${(minPrice / 1000).toFixed(0)}k - $${(maxPrice / 1000).toFixed(0)}k`,
                minPrice: minPrice,
                maxPrice: maxPrice,
                location: 'Colombia', // En un caso real esto vendría de otra tabla
                genre: musician.musiciangenre.map((mg: { musicalgenre: { name: string } }) => mg.musicalgenre.name),
                instrument: musician.musicianinstrument.map((mi: { instrument: { name: string } }) => mi.instrument.name).join(', '),
                events: musician.musicianevent.map((me: { event: { name: string } }) => me.event.name),
                availability: ['Fines de semana', 'Eventos privados'], // En un caso real esto vendría de otra tabla
                isPromoted: Math.random() > 0.5, // En un caso real esto vendría de otra tabla
                discount: Math.random() > 0.7 ? '15% de descuento para eventos en Diciembre' : undefined
            };
        });

        return NextResponse.json(formattedMusicians);
    } catch (error) {
        console.error('Error al obtener músicos:', error);
        return NextResponse.json(
            { error: 'Error al obtener los músicos' },
            { status: 500 }
        );
    }
} 