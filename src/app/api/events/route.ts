import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Obtener todos los eventos
        const events = await prisma.event.findMany();

        // Convertir a un formato más simple
        const formattedEvents = events.map(event => ({
            id: event.id,
            name: event.name
        }));

        return NextResponse.json(formattedEvents);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        return NextResponse.json(
            { error: 'Error al obtener los eventos' },
            { status: 500 }
        );
    }
} 