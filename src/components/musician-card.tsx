"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface UserData {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    role?: string;
}

// Tipo para los músicos
export type Musician = {
    id: string;
    name: string;
    image: string;
    rating: number;
    price: string;
    location: string;
    genre: string[];
    instrument: string;
    availability: string[];
    isPromoted: boolean;
    discount?: string;
};

interface MusicianCardProps {
    musician: Musician;
    showDiscount?: boolean;
}

export function MusicianCard({ musician, showDiscount = true }: MusicianCardProps) {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        // Obtener datos del usuario desde el localStorage
        
        const storedUser = localStorage.getItem("userData");

        if (storedUser) {
            try {
                setUserData(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }

        // Verificar si el músico ya es favorito
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        const isMusicianFavorite = favorites.some((fav: Musician) => fav.id === musician.id);
        setIsFavorite(isMusicianFavorite);
    }, [musician.id]);

    const handleViewProfile = () => {
        router.push(`/musicians/${musician.id}`);
    };

    const handleAddToFavorites = async () => {
        try {
            const response = await fetch(`/api/favorites`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clientId: userData?.id, // Reemplaza con el ID del cliente actual
                    musicianId: musician.id,
                }),
            });

            if (!response.ok) {
                throw new Error("Error al añadir a favoritos");
            }

            const data = await response.json();
            console.log("Músico añadido a favoritos:", data);

            // Actualizar el estado de favoritos
            setIsFavorite(true);

            // Guardar en localStorage
            const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            favorites.push(musician);
            localStorage.setItem("favorites", JSON.stringify(favorites));
        } catch (error) {
            console.error("Error al añadir a favoritos:", error);
        }
    };

    const handleRemoveFromFavorites = () => {
        // Eliminar el músico de favoritos
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        const updatedFavorites = favorites.filter((fav: Musician) => fav.id !== musician.id);
        localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
        setIsFavorite(false);
    };

    return (
        <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-[400px] sm:h-[450px] cursor-pointer"
            onClick={handleViewProfile}
        >
            {/* Imagen con altura fija */}
            <div className="relative h-40 sm:h-48">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${musician.image})` }}
                />
                {showDiscount && musician.discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs py-1 px-2 rounded">
                        Oferta especial
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center text-white">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span>{musician.rating}</span>
                    </div>
                </div>
            </div>

            {/* Contenido con altura flexible */}
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 mb-2">
                    <h3 className="font-bold text-sm sm:text-base">{musician.name}</h3>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {musician.location}
                    </span>
                </div>

                <div className="mb-2">
                    <span className="font-semibold text-sm sm:text-base text-primary">
                        {musician.price}
                    </span>
                    {showDiscount && musician.discount && (
                        <p className="text-xs text-red-500 mt-1">{musician.discount}</p>
                    )}
                </div>

                <div className="mb-2 sm:mb-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {musician.genre.map(g => (
                            <span key={g} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                {g}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        {musician.instrument}
                    </p>
                </div>

                {/* Información de disponibilidad */}
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">
                    <p>Disponible para:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {musician.availability.map(a => (
                            <span key={a} className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                                {a}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Botones siempre al final de la tarjeta */}
                <div className="flex space-x-2 mt-auto">
                    <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm py-1 sm:py-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/musicians/${musician.id}`);
                        }}
                    >
                        Reservar
                    </Button>
                    <Button
                        variant="outline"
                        className={`px-2 sm:px-3 border-primary hover:bg-primary/10 text-primary ${isFavorite ? 'text-red-500 border-red-500' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isFavorite) {
                                handleRemoveFromFavorites();
                            } else {
                                handleAddToFavorites();
                            }
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </Button>
                </div>
            </div>
        </div>
    );
} 