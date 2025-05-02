"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

interface FavoriteCardProps {
    musician: Musician;
    onRemove: (id: string) => void; // Función para eliminar de favoritos
}

export const FavoriteCard: React.FC<FavoriteCardProps> = ({ musician, onRemove }) => {
    const router = useRouter();

    const handleViewProfile = () => {
        router.push(`/musicians/${musician.id}`);
    };


    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="relative h-40">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${musician.image})` }} // Usar la imagen como fondo
                />
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold">{musician.name}</h3>
                <p className="text-sm text-gray-600">{musician.location}</p>
                <div className="flex items-center mt-2">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span>{musician.rating}</span>
                </div>
                <div className="mt-4">
                    <Button onClick={handleViewProfile} className="w-full">
                        Ver Perfil
                    </Button>
                    <Button onClick={() => onRemove(musician.id)} variant="outline" className="w-full mt-2">
                        Eliminar de Favoritos
                    </Button>
                </div>
            </div>
        </div>
    );
};