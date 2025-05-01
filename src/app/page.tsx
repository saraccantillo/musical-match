"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface Musician {
  id: string;
  name: string;
  genres: string[];
  location: string;
  rating: number;
  reviews: number;
  image: string;
}

export default function Home() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) {
      setUserRole(storedRole);
    }

    // En un escenario real, aquí consultaríamos la API para obtener los músicos
    // desde la base de datos
    // Esta es una simulación de datos que luego vendrán desde el backend
    setMusicians([
      {
        id: "1",
        name: "Juan Pérez",
        genres: ["Rock", "Pop", "Balada"],
        location: "Bogotá, Colombia",
        rating: 4.8,
        reviews: 23,
        image: "/images/profile.jpg"
      },
      {
        id: "2",
        name: "María López",
        genres: ["Salsa", "Cumbia", "Bachata"],
        location: "Medellín, Colombia",
        rating: 4.9,
        reviews: 45,
        image: "/images/profile.jpg"
      },
      {
        id: "3",
        name: "David Sánchez",
        genres: ["Clásica", "Electrónica"],
        location: "Cali, Colombia",
        rating: 4.7,
        reviews: 18,
        image: "/images/profile.jpg"
      },
      {
        id: "4",
        name: "Laura Jiménez",
        genres: ["Bolero", "Vallenato"],
        location: "Barranquilla, Colombia",
        rating: 4.6,
        reviews: 32,
        image: "/images/profile.jpg"
      },
      {
        id: "5",
        name: "Carlos Vives",
        genres: ["Jazz", "Salsa", "Cumbia", "Bolero"],
        location: "Pereira, Colombia",
        rating: 4.8,
        reviews: 56,
        image: "/images/profile.jpg"
      }
    ]);

    setLoading(false);
  }, []);

  const handleAuth = () => {
    router.push("/sign-in");
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Músico tocando"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            Encuentra los mejores músicos para tu evento
          </h1>
          <p className="text-xl mb-8">
            Conecta con talento musical profesional para bodas, eventos
            corporativos y más.
          </p>
          {!userRole && (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={handleAuth}
                className="bg-white text-black hover:bg-gray-200"
                size="lg"
              >
                Registrarme
              </Button>
              <Button
                onClick={handleAuth}
                variant="outline"
                className="border-white text-white hover:bg-white/20"
                size="lg"
              >
                Iniciar Sesión
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Musicians Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-black">
          Músicos Destacados
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <p className="text-center col-span-full">Cargando músicos...</p>
          ) : (
            musicians.map((musician) => (
              <Link href={`/musicians/${musician.id}`} key={musician.id}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-64">
                    <Image
                      src={musician.image}
                      alt={musician.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-black">
                      {musician.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {musician.genres.slice(0, 3).map((genre, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin size={16} className="mr-1" />
                      {musician.location}
                    </div>
                    <div className="flex items-center text-sm">
                      <Star
                        size={16}
                        className="text-yellow-400 mr-1 fill-yellow-400"
                      />
                      <span className="font-medium">{musician.rating}</span>
                      <span className="text-gray-500 ml-1">
                        ({musician.reviews} reseñas)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {userRole === "CLIENT" && (
          <div className="text-center mt-12">
            <Button
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => router.push("/search")}
            >
              Ver todos los músicos
            </Button>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">
            ¿Por qué elegir MusicalMatch?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-gray-800" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">
                Músicos profesionales
              </h3>
              <p className="text-gray-600">
                Todos nuestros músicos son seleccionados cuidadosamente para
                garantizar la mejor calidad.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-gray-800" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">
                Reservas sencillas
              </h3>
              <p className="text-gray-600">
                Proceso de reserva rápido y seguro con confirmación instantánea.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-gray-800" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">
                Cobertura nacional
              </h3>
              <p className="text-gray-600">
                Encuentra músicos en las principales ciudades de Colombia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
