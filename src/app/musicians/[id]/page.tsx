"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, DollarSign, Calendar, Star, Music, Heart } from "lucide-react";
import Image from "next/image";
import { ReservationForm, type ReservationData } from "@/components/reservation-form";
import { Chat } from "@/components/chat";

// Tipos para el músico
interface Musician {
    id: string;
    name: string;
    description: string;
    genres: string[];
    location: string;
    priceRange: string;
    image: string;
    rating: number;
    totalReviews: number;
    availability: string;
    repertoire: string[];
    reviews: {
        name: string;
        date: string;
        rating: number;
        comment: string;
    }[];
    events?: string[];
}

// Tipos para el usuario
interface UserData {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    role?: string;
}

export default function MusicianProfilePage() {
    const router = useRouter();
    const params = useParams();
    const musicianId = params.id as string;

    const [currentImage, setCurrentImage] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
    const [reservation, setReservation] = useState<ReservationData | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [musician, setMusician] = useState<Musician | null>(null);

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
                setUserData(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }

        // Obtener datos del músico desde la API específica por ID
        const fetchMusicianData = async () => {
            try {
                const response = await fetch(`/api/musicians/${musicianId}`);
                if (!response.ok) {
                    throw new Error('Error al cargar los datos del músico');
                }

                const musicianData = await response.json();

                if (musicianData) {
                    setMusician({
                        id: musicianData.id,
                        name: musicianData.name,
                        description: musicianData.description || "Músico profesional con experiencia en eventos.",
                        genres: musicianData.genre || [],
                        location: musicianData.location || "Colombia",
                        priceRange: musicianData.price || "$200k - $500k",
                        image: musicianData.image || "/images/profile.jpg",
                        rating: musicianData.rating || 4.5,
                        totalReviews: musicianData.totalReviews || 0,
                        availability: "Disponible los fines de semana",
                        repertoire: musicianData.repertoire || [
                            "Música variada según el evento"
                        ],
                        reviews: musicianData.reviews || [],
                        events: musicianData.events || []
                    });
                } else {
                    console.error("Músico no encontrado");
                }
            } catch (error) {
                console.error("Error fetching musician data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMusicianData();
    }, [musicianId]);

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

    const handleReservationSubmit = (data: ReservationData) => {
        console.log("Reserva enviada:", data);
        setReservation(data);
        // En un escenario real, aquí enviaríamos los datos a la API
        // saveReservation(data)
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        // En un escenario real, aquí actualizaríamos la lista de favoritos en la API
        // updateFavorites(musicianId, !isFavorite)
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    // Si el usuario no está autenticado, mostrar mensaje
    if (!userRole) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-bold mb-4">Iniciar sesión requerido</h1>
                <p className="text-gray-600 mb-6">Debes iniciar sesión para ver el perfil de este músico.</p>
                <Button onClick={() => router.push('/sign-in')}>
                    Iniciar Sesión
                </Button>
            </div>
        );
    }

    // Si no se encontró el músico
    if (!musician) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-bold mb-4">Músico no encontrado</h1>
                <p className="text-gray-600 mb-6">No pudimos encontrar la información del músico solicitado.</p>
                <Button onClick={() => router.push('/dashboard')}>
                    Volver al Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black">
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex flex-col lg:flex-row gap-8 mt-12">
                    {/* Imagen de perfil y detalles */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
                            <div className="relative aspect-square">
                                <Image
                                    src={musician.image}
                                    alt={musician.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <h1 className="text-3xl font-bold">{musician.name}</h1>
                            {userRole === "CLIENT" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleFavorite}
                                    className="hover:bg-transparent"
                                >
                                    <Heart
                                        className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                                    />
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center mt-2">
                            <Star className="h-5 w-5 text-yellow-400" />
                            <span className="ml-1 font-medium">{musician.rating}</span>
                            <span className="ml-1 text-gray-500">({musician.totalReviews} reseñas)</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {musician.genres.map((genre) => (
                                <Badge key={genre} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-black">
                                    {genre}
                                </Badge>
                            ))}
                        </div>

                        <div className="flex items-center mt-4 text-gray-700">
                            <MapPin size={18} className="mr-2" />
                            <span>{musician.location}</span>
                        </div>

                        <div className="flex items-center mt-2 text-gray-700">
                            <DollarSign size={18} className="mr-2" />
                            <span>{musician.priceRange}</span>
                        </div>

                        <div className="flex items-center mt-2 text-gray-700">
                            <Calendar size={18} className="mr-2" />
                            <span>{musician.availability}</span>
                        </div>

                        {/* Botón de reserva - solo visible para los clientes */}
                        {userRole === "CLIENT" && userData?.id !== musicianId && (
                            <Button
                                className="w-full mt-6 bg-black hover:bg-gray-800 text-white"
                                onClick={() => setIsReservationDialogOpen(true)}
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
                                {reservation && <TabsTrigger value="chat">Chat</TabsTrigger>}
                            </TabsList>

                            <TabsContent value="description" className="mt-6">
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold mb-4">Acerca de mí</h2>
                                    <p className="text-gray-700">{musician.description}</p>

                                    <h2 className="text-xl font-bold mt-8 mb-4">Disponible para eventos</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {(musician.events || []).map((eventName, index) => {
                                            const eventImg = eventImages.find(e => e.title === eventName);
                                            return (
                                                <div key={index} className="text-center">
                                                    <div className="rounded-lg overflow-hidden mb-2">
                                                        <Image
                                                            src={eventImg?.src || "/images/party.jpg"}
                                                            alt={eventName}
                                                            width={150}
                                                            height={100}
                                                            className="object-cover w-full h-[100px]"
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium">{eventName}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="repertoire" className="mt-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h2 className="text-xl font-semibold mb-3">Mi repertorio</h2>
                                    <ul className="space-y-2">
                                        {musician.repertoire.map((song, index) => (
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
                                        {musician.reviews.map((review, index) => (
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

                            {reservation && (
                                <TabsContent value="chat" className="mt-4">
                                    {userData && (
                                        <Chat
                                            clientId={userData.id || "client-1"}
                                            musicianId={musician.id}
                                            clientName={userData.name || "Cliente"}
                                            musicianName={musician.name}
                                            reservationData={reservation}
                                        />
                                    )}
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Formulario de reserva */}
            {isReservationDialogOpen && userRole === "CLIENT" && (
                <ReservationForm
                    isOpen={true}
                    onClose={() => setIsReservationDialogOpen(false)}
                    onSubmit={handleReservationSubmit}
                    initialPrice={musician.priceRange.replace(/[^0-9]/g, "").length > 0
                        ? parseInt(musician.priceRange.replace(/[^0-9]/g, ""))
                        : 300000}
                />
            )}
        </div>
    );
} 