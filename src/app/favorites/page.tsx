"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { useRouter } from "next/navigation";
import { FavoriteCard } from "@/components/favorite-card";

interface UserData {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    role?: string;
}

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

const FavoritesPage = () => {
    const [favoriteMusicians, setFavoriteMusicians] = useState<Musician[]>([]);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!userData) return; // Asegúrate de que userData esté disponible

            try {
                const favoriteRes = await fetch(`/api/favorites?clientId=${userData.id}`);
                const favoritedData = await favoriteRes.json();

                // Aquí puedes mapear los datos para incluir el filePath
                setFavoriteMusicians(Array.isArray(favoritedData.data) ? favoritedData.data.map((fav: any) => ({
                    ...fav.musician,
                    image: fav.musician.media[0]?.filePath || 'default_image_url', // Obtén el filePath
                })) : []);
            } catch (error) {
                console.error("Error al cargar los favoritos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [userData]);

    const handleRemoveFavorite = async (id: string) => {
        if (!userData) return; // Asegúrate de que userData esté disponible

        try {
            const response = await fetch(`/api/favorites`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: userData.id,
                    musicianId: id,
                }),
            });

            const result = await response.json();
            if (result.success) {
                // Actualiza el estado para eliminar el músico de la lista
                setFavoriteMusicians((prev) => prev.filter((musician) => musician.id !== id));
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error("Error al eliminar el favorito:", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Artistas Favoritos</h1>
            {favoriteMusicians.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center">
                    <p className="text-lg">No tienes músicos favoritos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteMusicians.map((musician) => (
                        <FavoriteCard
                            key={musician.id}
                            musician={musician}
                            onRemove={handleRemoveFavorite}
                        />
                    ))}
                </div>
            )}
            <Footer />
        </div>
    );
};

export default FavoritesPage;
