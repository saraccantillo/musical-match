"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ChatHistory } from "@/components/chat-history";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, DollarSign, Calendar, Star, Music, User, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { getUserInitials } from "@/lib/utils";
import ReservationsTable from "@/components/reservations-table";

// Interfaz para tipos de usuarios
interface UserData {
    id?: string;
    username?: string;
    name?: string;
    email?: string;
    phone?: string;
    imageUrl?: string;
    city?: string;
}

export default function ProfilePage() {
    const [currentImage, setCurrentImage] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [artistData, setArtistData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("description");
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
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

        // Escuchar el evento para cambiar a la pestaña de chats
        const handleSwitchToChatsTab = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail && customEvent.detail.userId) {
                setActiveTab("chats");
                setSelectedClientId(customEvent.detail.userId);
            }
        };

        document.addEventListener('switchToChatsTab', handleSwitchToChatsTab);
        return () => {
            document.removeEventListener('switchToChatsTab', handleSwitchToChatsTab);
        };
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
            <div className="container mx-auto py-10 px-4 md:px-6">
                {!loading ? (
                    <>
                        <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

                        {userData ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Sidebar con información del perfil */}
                                <div className="col-span-1">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-center mb-4">
                                                <Avatar className="w-20 h-20 mx-auto mb-2">
                                                    <AvatarFallback className="text-xl">
                                                        {getUserInitials(userData.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <h2 className="text-xl font-semibold">{userData.name}</h2>
                                                <p className="text-gray-500 text-sm">{userRole === "MUSICIAN" ? "Músico" : "Cliente"}</p>
                                            </div>

                                            <Separator className="my-4" />

                                            <div className="mt-4 space-y-2">
                                                <div>
                                                    <p className="text-sm font-medium">Email:</p>
                                                    <p className="text-sm text-gray-500">{userData.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Teléfono:</p>
                                                    <p className="text-sm text-gray-500">{userData.phone || "No especificado"}</p>
                                                </div>
                                                {userData.city && (
                                                    <div>
                                                        <p className="text-sm font-medium">Ciudad:</p>
                                                        <p className="text-sm text-gray-500">{userData.city}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-6">
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => router.push('/reservations')}
                                                >
                                                    Ver mis reservas
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Contenido principal */}
                                <div className="col-span-1 md:col-span-3">
                                    <Tabs defaultValue="reservations" className="w-full">
                                        <TabsList className="bg-white border border-gray-200">
                                            <TabsTrigger value="reservations">Mis Reservas</TabsTrigger>
                                            <TabsTrigger value="favorites">Mis Favoritos</TabsTrigger>
                                            <TabsTrigger value="reviews">Mis Opiniones</TabsTrigger>
                                            <TabsTrigger value="chats">Mis Chats</TabsTrigger>
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

                                        <TabsContent value="chats" className="mt-4">
                                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                                <h2 className="text-xl font-semibold mb-3">Mis Conversaciones</h2>
                                                <p className="text-sm text-gray-500 mb-4">Gestiona todos tus chats con clientes</p>
                                                <ChatHistory showOnlyChats={true} showChatsHeader={false} />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p>No se encontró información del perfil.</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => router.push('/sign-in')}
                                >
                                    Iniciar sesión
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-10">
                        <p>Cargando información...</p>
                    </div>
                )}
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
        <div className="container mx-auto py-10 px-4 md:px-6">
            {!loading ? (
                <>
                    <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

                    {userData ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Sidebar con información del perfil */}
                            <div className="col-span-1">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center mb-4">
                                            <Avatar className="w-20 h-20 mx-auto mb-2">
                                                <AvatarFallback className="text-xl">
                                                    {getUserInitials(userData.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h2 className="text-xl font-semibold">{userData.name}</h2>
                                            <p className="text-gray-500 text-sm">{userRole === "MUSICIAN" ? "Músico" : "Cliente"}</p>
                                        </div>

                                        <Separator className="my-4" />

                                        <div className="mt-4 space-y-2">
                                            <div>
                                                <p className="text-sm font-medium">Email:</p>
                                                <p className="text-sm text-gray-500">{userData.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Teléfono:</p>
                                                <p className="text-sm text-gray-500">{userData.phone || "No especificado"}</p>
                                            </div>
                                            {userData.city && (
                                                <div>
                                                    <p className="text-sm font-medium">Ciudad:</p>
                                                    <p className="text-sm text-gray-500">{userData.city}</p>
                                                </div>
                                            )}
                                        </div>

                                        {userRole === "CLIENT" && (
                                            <div className="mt-6">
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => router.push('/reservations')}
                                                >
                                                    Ver mis reservas
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contenido principal */}
                            <div className="col-span-1 md:col-span-3">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                                    <h2 className="text-xl font-semibold mb-3">Mis Reservas</h2>
                                                    <p className="text-sm text-gray-500 mb-4">Gestiona tus reservas con músicos</p>

                                                    <div className="mb-4">
                                                        <Tabs defaultValue="all" onValueChange={(value) => {
                                                            const event = new CustomEvent('tabChange', { detail: { tab: value } });
                                                            document.dispatchEvent(event);
                                                        }}>
                                                            <TabsList className="mb-4">
                                                                <TabsTrigger value="all">Todas</TabsTrigger>
                                                                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                                                                <TabsTrigger value="completed">Completadas</TabsTrigger>
                                                                <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
                                                            </TabsList>

                                                            <div className="overflow-x-auto">
                                                                <ReservationsTable
                                                                    onChatSelect={(clientId) => {
                                                                        setActiveTab("chats");
                                                                        setSelectedClientId(clientId);
                                                                    }}
                                                                />
                                                            </div>
                                                        </Tabs>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="chats" className="mt-4">
                                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                                    <h2 className="text-xl font-semibold mb-3">Mis Conversaciones</h2>
                                                    <p className="text-sm text-gray-500 mb-4">Gestiona todos tus chats con clientes</p>
                                                    <ChatHistory
                                                        showOnlyChats={true}
                                                        showChatsHeader={false}
                                                        specificClientId={selectedClientId}
                                                    />
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
                    ) : (
                        <div className="text-center py-10">
                            <p>No se encontró información del perfil.</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => router.push('/sign-in')}
                            >
                                Iniciar sesión
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-10">
                    <p>Cargando información...</p>
                </div>
            )}
        </div>
    );
} 