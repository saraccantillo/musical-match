"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, DollarSign, Calendar, Star, Music, User, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { ChatHistory } from "@/components/chat-history";

// Interfaz para tipos de usuarios
interface UserData {
    id?: string;
    username?: string;
    name?: string;
    email?: string;
    phone?: string;
    imageUrl?: string;
}

export default function ProfilePage() {
    const [currentImage, setCurrentImage] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [artistData, setArtistData] = useState<any>(null);
    const router = useRouter();

    const images = [
        "/images/gallery-1.jpg",
        "/images/gallery-2.jpg",
        "/images/gallery-3.jpg",
    ];

    useEffect(() => {
        // Obtener el rol y datos del usuario desde el localStorage
        const storedRole = localStorage.getItem("userRole");
        const storedUser = localStorage.getItem("userData");

        if (storedRole) {
            setUserRole(storedRole);
        }

        if (storedUser) {
            try {
                const parsedUserData = JSON.parse(storedUser);
                setUserData(parsedUserData);

                // Si es músico, obtener datos adicionales desde la API
                if (storedRole === "MUSICIAN" && parsedUserData.id) {
                    fetchMusicianData(parsedUserData.id);
                }
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }

        setLoading(false);
    }, []);

    const fetchMusicianData = async (musicianId: string) => {
        try {
            const response = await fetch(`/api/musicians/${musicianId}`);
            if (!response.ok) {
                throw new Error('Error obteniendo datos del músico');
            }
            const data = await response.json();

            if (data.success) {
                setArtistData(data.data);
            }
        } catch (error) {
            console.error('Error al obtener datos del músico:', error);
        }
    };

    const nextImage = () => {
        setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevImage = () => {
        setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    // Imágenes de eventos disponibles
    const eventImages = [
        { src: "/images/wedding.jpg", title: "Bodas" },
        { src: "/images/corporate.jpg", title: "Eventos Corporativos" },
        { src: "/images/graduation.jpg", title: "Graduaciones" },
        { src: "/images/party.jpg", title: "Fiestas Privadas" },
    ];

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    // Renderizar perfil de cliente si el rol es CLIENT
    if (userRole === "CLIENT") {
        return (
            <div className="min-h-screen bg-white text-black">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="flex flex-col lg:flex-row gap-8 mt-12">
                        {/* Imagen de perfil y detalles del cliente */}
                        <div className="w-full lg:w-1/3">
                            <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
                                <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                                    {userData?.imageUrl ? (
                                        <Image
                                            src={userData.imageUrl}
                                            alt={userData?.name || "Usuario"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User size={80} className="text-gray-400" />
                                    )}
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold mt-4">{userData?.name || "Usuario"}</h1>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-center text-gray-700">
                                    <User size={18} className="mr-2" />
                                    <span>{userData?.username || "username"}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Mail size={18} className="mr-2" />
                                    <span>{userData?.email || "email@example.com"}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Phone size={18} className="mr-2" />
                                    <span>{userData?.phone || "Teléfono no disponible"}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-6 bg-black hover:bg-gray-800 text-white"
                                onClick={() => router.push('/dashboard')}
                            >
                                Buscar músicos
                            </Button>
                        </div>

                        {/* Contenido principal - tabs para cliente */}
                        <div className="w-full lg:w-2/3">
                            <Tabs defaultValue="reservations" className="w-full">
                                <TabsList className="bg-white border border-gray-200">
                                    <TabsTrigger value="reservations">Mis Reservas</TabsTrigger>
                                    <TabsTrigger value="favorites">Mis Favoritos</TabsTrigger>
                                    <TabsTrigger value="reviews">Mis Opiniones</TabsTrigger>
                                </TabsList>

                                <TabsContent value="reservations" className="mt-4">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h2 className="text-xl font-semibold mb-3">Mis Reservas</h2>
                                        <div className="text-gray-500 italic">
                                            No tienes reservas activas. ¡Encuentra un músico para tu próximo evento!
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="favorites" className="mt-4">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h2 className="text-xl font-semibold mb-3">Mis Músicos Favoritos</h2>
                                        <div className="text-gray-500 italic">
                                            No tienes músicos favoritos. Marca como favorito a los músicos que te interesen.
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="reviews" className="mt-4">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h2 className="text-xl font-semibold mb-3">Mis Opiniones</h2>
                                        <div className="text-gray-500 italic">
                                            No has dejado opiniones. Comparte tu experiencia después de una reserva.
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Preparar la información del artista basada en datos reales o datos por defecto
    const artist = artistData || {
        name: userData?.name || "Músico",
        description: "Información no disponible",
        genres: [],
        location: "Ubicación no disponible",
        priceRange: "Precio no disponible",
        image: "/images/profile.jpg",
        rating: 0,
        totalReviews: 0,
        availability: "Disponibilidad no disponible",
        repertoire: [],
        reviews: []
    };

    // Mostrar datos del músico
    const locationText = artistData?.city
        ? `${artistData.city.name}, ${artistData.city.department.name}`
        : artist.location;

    const priceRangeText = artistData?.minPrice && artistData?.maxPrice
        ? `$${Number(artistData.minPrice).toLocaleString()} - $${Number(artistData.maxPrice).toLocaleString()}`
        : artist.priceRange;

    // Renderizar perfil de músico (caso por defecto)
    return (
        <div className="min-h-screen bg-white text-black">
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex flex-col lg:flex-row gap-8 mt-12">
                    {/* Imagen de perfil y detalles */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
                            <div className="relative aspect-square">
                                <Image
                                    src={artistData?.media?.[0]?.filePath || artist.image}
                                    alt={artist.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold mt-4">{artist.name}</h1>

                        <div className="flex items-center mt-2">
                            <Star className="h-5 w-5 text-yellow-400" />
                            <span className="ml-1 font-medium">{artist.rating}</span>
                            <span className="ml-1 text-gray-500">({artist.totalReviews} reseñas)</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {artistData?.genres?.map((genre: any) => (
                                <Badge key={genre.id} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-black">
                                    {genre.name}
                                </Badge>
                            )) || artist.genres.map((genre: string) => (
                                <Badge key={genre} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-black">
                                    {genre}
                                </Badge>
                            ))}
                        </div>

                        <div className="flex items-center mt-4 text-gray-700">
                            <MapPin size={18} className="mr-2" />
                            <span>{locationText}</span>
                        </div>

                        <div className="flex items-center mt-2 text-gray-700">
                            <DollarSign size={18} className="mr-2" />
                            <span>{priceRangeText}</span>
                        </div>

                        <div className="flex items-center mt-2 text-gray-700">
                            <Calendar size={18} className="mr-2" />
                            <span>{artist.availability}</span>
                        </div>

                        {/* El botón "Reservar artista" solo se muestra si es un cliente viendo el perfil del músico */}
                        {userRole === "CLIENT" && (
                            <Button
                                className="w-full mt-6 bg-black hover:bg-gray-800 text-white"
                                onClick={() => router.push(`/reservations/new?musician=${artist.id}`)}
                            >
                                Reservar artista
                            </Button>
                        )}
                    </div>

                    {/* Contenido principal - tabs */}
                    <div className="w-full lg:w-2/3">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList className="bg-white border border-gray-200">
                                <TabsTrigger value="description">Descripción</TabsTrigger>
                                <TabsTrigger value="repertoire">Repertorio</TabsTrigger>
                                <TabsTrigger value="reviews">Opiniones</TabsTrigger>
                                <TabsTrigger value="gallery">Galería</TabsTrigger>
                                {userRole === "MUSICIAN" && (
                                    <>
                                        <TabsTrigger value="reservations">Mis Reservas</TabsTrigger>
                                        <TabsTrigger value="chats">Mis Chats</TabsTrigger>
                                    </>
                                )}
                            </TabsList>

                            <TabsContent value="description" className="mt-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h2 className="text-xl font-semibold mb-3">Acerca de mí</h2>
                                    <p className="text-gray-700">{artist.description}</p>
                                </div>

                                {/* Sección de eventos disponibles */}
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
                                    <h2 className="text-xl font-semibold mb-4">Disponible para eventos</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {eventImages.map((event, index) => (
                                            <div key={index} className="flex flex-col items-center">
                                                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2">
                                                    <Image
                                                        src={event.src}
                                                        alt={event.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">{event.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="repertoire" className="mt-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h2 className="text-xl font-semibold mb-3">Mi repertorio</h2>
                                    <ul className="space-y-2">
                                        {artist.repertoire.map((song, index) => (
                                            <li key={index} className="flex items-center">
                                                <Music size={16} className="mr-2 text-gray-500" />
                                                <span className="text-gray-700">{song}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="mt-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h2 className="text-xl font-semibold mb-3">Opiniones de clientes</h2>
                                    <div className="space-y-4">
                                        {artist.reviews.map((review, index) => (
                                            <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-medium">{review.name}</h3>
                                                    <span className="text-sm text-gray-500">{review.date}</span>
                                                </div>
                                                <div className="flex items-center mt-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                                                            fill={i < review.rating ? "currentColor" : "none"}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-gray-700">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {userRole === "MUSICIAN" && (
                                <>
                                    <TabsContent value="reservations" className="mt-4">
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                            <ChatHistory />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="chats" className="mt-4">
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                            <ChatHistory showOnlyChats={true} />
                                        </div>
                                    </TabsContent>
                                </>
                            )}

                            <TabsContent value="gallery" className="mt-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h2 className="text-xl font-semibold mb-3">Galería</h2>
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                        <div className="aspect-video relative">
                                            <Image
                                                src={images[currentImage]}
                                                alt="Gallery image"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
                                        >
                                            <ChevronLeft size={24} className="text-white" />
                                        </button>

                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
                                        >
                                            <ChevronRight size={24} className="text-white" />
                                        </button>
                                    </div>

                                    <div className="flex mt-4 gap-2 overflow-x-auto pb-2">
                                        {images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className={`relative w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${currentImage === idx ? 'border-black' : 'border-transparent'}`}
                                                onClick={() => setCurrentImage(idx)}
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
} 