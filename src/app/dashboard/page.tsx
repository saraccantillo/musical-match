"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MusicianCard, type Musician } from "@/components/musician-card";
import { Footer } from "@/components/footer";
import { useRouter } from "next/navigation";


// Categorías populares (esto podría venir de una API también)
const popularCategories = [
    {
        id: "1",
        name: "Matrimonios",
        image: "/images/wedding.jpg",
        description: "Música en vivo para tu día especial"
    },
    {
        id: "2",
        name: "Fiestas",
        image: "./images/party.jpg",
        description: "Animación para cualquier celebración"
    },
    {
        id: "3",
        name: "Serenatas",
        image: "/images/serenade.jpg",
        description: "Sorprende a esa persona especial"
    },
    {
        id: "4",
        name: "Corporativos",
        image: "/images/corporate.jpg",
        description: "Eventos empresariales exclusivos"
    }
];

export default function Dashboard() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    // Estados para almacenar datos de las APIs
    const [musicians, setMusicians] = useState<Musician[]>([]);
    const [genreList, setGenreList] = useState<string[]>([]);
    const [instrumentList, setInstrumentList] = useState<string[]>([]);

    // Cargar datos de APIs
    useEffect(() => {
        async function fetchData() {
            try {
                // Cargar músicos
                const musiciansRes = await fetch('/api/musicians');
                const musiciansData = await musiciansRes.json();
                setMusicians(Array.isArray(musiciansData) ? musiciansData : []);

                // Cargar géneros
                const genresRes = await fetch('/api/genres');
                const genresData = await genresRes.json();
                setGenreList(Array.isArray(genresData) ? genresData : []);

                // Cargar instrumentos
                const instrumentsRes = await fetch('/api/instruments');
                const instrumentsData = await instrumentsRes.json();
                setInstrumentList(Array.isArray(instrumentsData) ? instrumentsData : []);
            } catch (error) {
                console.error('Error al cargar datos:', error);
            }
        }

        fetchData();
    }, []);

    useEffect(() => {
        // Comprobar el rol del usuario
        const storedRole = localStorage.getItem("userRole");

        if (storedRole) {
            setUserRole(storedRole);

            // Si es músico, redirigir a su perfil
            if (storedRole === "MUSICIAN") {
                router.push('/profile');
            }
        }

        setLoading(false);
    }, [router]);

    // Si está cargando o es músico, mostrar spinner o nada
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    // Si no hay rol, redirigir a login
    if (!userRole) {
        router.push('/sign-in');
        return null;
    }

    // Función para filtrar músicos - asegurarse de que musicians sea un array
    const filteredMusicians = Array.isArray(musicians) ? musicians.filter(musician => {
        // Filtro por búsqueda
        const searchMatch =
            searchTerm === "" ||
            musician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (musician.location && musician.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
            musician.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
            musician.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));

        // Filtro por géneros
        const genreMatch =
            selectedGenres.length === 0 ||
            musician.genre.some(g => selectedGenres.includes(g));

        // Filtro por instrumento (adaptado para la nueva estructura que puede incluir múltiples instrumentos)
        const instrumentMatch =
            selectedInstruments.length === 0 ||
            selectedInstruments.some(inst => musician.instrument.includes(inst));

        // Devolver si cumple todos los filtros
        return searchMatch && genreMatch && instrumentMatch;
    }) : [];

    // Función para togglear géneros seleccionados
    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
    };

    // Función para togglear instrumentos seleccionados
    const toggleInstrument = (instrument: string) => {
        setSelectedInstruments(prev =>
            prev.includes(instrument)
                ? prev.filter(i => i !== instrument)
                : [...prev, instrument]
        );
    };

    return userRole === "CLIENT" ? (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <main className="container mx-auto px-4 py-6">
                {/* Banner principal */}
                <div className="relative w-full h-60 sm:h-72 md:h-80 rounded-xl overflow-hidden mb-6 sm:mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60 opacity-90 z-10" />
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1470&auto=format&fit=crop')" }}
                    />
                    <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-16 z-20 text-primary-foreground">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                            Encuentra tu músico ideal
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 max-w-lg">
                            Miles de artistas disponibles para hacer de tu evento una experiencia inolvidable
                        </p>
                        <Button className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground">
                            Explorar Artistas
                        </Button>
                    </div>
                </div>

                {/* Contenido principal con filtros laterales */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filtros (colapsables en móvil) */}
                    <aside className="w-full lg:w-64 lg:shrink-0">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-lg">Filtros</h2>
                                <Button
                                    variant="ghost"
                                    className="lg:hidden p-1 h-auto"
                                    onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                                    aria-expanded={isFiltersVisible}
                                    aria-controls="filter-options"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d={isFiltersVisible ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
                                    </svg>
                                    <span className="sr-only">
                                        {isFiltersVisible ? "Colapsar filtros" : "Expandir filtros"}
                                    </span>
                                </Button>
                            </div>

                            <div
                                id="filter-options"
                                className={`space-y-6 ${isFiltersVisible ? 'block' : 'hidden lg:block'}`}
                            >
                                <div className="mb-4">
                                    <h3 className="font-medium mb-2">Géneros Musicales</h3>
                                    <div className="space-y-2">
                                        {genreList.slice(0, 6).map(genre => (
                                            <div key={genre} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`genre-${genre}`}
                                                    className="mr-2 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    checked={selectedGenres.includes(genre)}
                                                    onChange={() => toggleGenre(genre)}
                                                />
                                                <label htmlFor={`genre-${genre}`} className="text-sm">{genre}</label>
                                            </div>
                                        ))}
                                        {genreList.length > 6 && (
                                            <Button variant="link" className="text-xs p-0 h-auto text-primary">
                                                Ver más géneros
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-medium mb-2">Instrumentos</h3>
                                    <div className="space-y-2">
                                        {instrumentList.slice(0, 6).map(instrument => (
                                            <div key={instrument} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`instrument-${instrument}`}
                                                    className="mr-2 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    checked={selectedInstruments.includes(instrument)}
                                                    onChange={() => toggleInstrument(instrument)}
                                                />
                                                <label htmlFor={`instrument-${instrument}`} className="text-sm">{instrument}</label>
                                            </div>
                                        ))}
                                        {instrumentList.length > 6 && (
                                            <Button variant="link" className="text-xs p-0 h-auto text-primary">
                                                Ver más instrumentos
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-medium mb-2">Rango de Precio</h3>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000000"
                                            step="50000"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary dark:bg-slate-700"
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs mt-2">
                                        <span>$0</span>
                                        <span className="text-primary font-medium">${Math.floor(priceRange[1] / 1000)}k</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Disponibilidad</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input type="checkbox" id="weekends" className="mr-2 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                            <label htmlFor="weekends" className="text-sm">Fines de semana</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" id="weekdays" className="mr-2 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                            <label htmlFor="weekdays" className="text-sm">Días de semana</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" id="evenings" className="mr-2 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                            <label htmlFor="evenings" className="text-sm">Solo noches</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Contenido principal */}
                    <div className="flex-1">
                        {/* Categorías populares */}
                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Categorías populares</h2>
                                <Button variant="link" className="text-primary hover:text-primary/80">Ver todas</Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {popularCategories.map(category => (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.id}`}
                                        className="group relative h-32 sm:h-40 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10" />
                                        <div
                                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                                            style={{ backgroundImage: `url(${category.image})` }}
                                        />
                                        <div className="absolute inset-0 flex flex-col justify-end p-4 z-20 text-white">
                                            <h3 className="font-bold text-lg">{category.name}</h3>
                                            <p className="text-sm opacity-90">{category.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Músicos promocionados */}
                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Ofertas especiales</h2>
                                <Button variant="link" className="text-primary hover:text-primary/80">Ver todas</Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {Array.isArray(musicians) && musicians.filter(m => m.isPromoted).map(musician => (
                                    <MusicianCard key={musician.id} musician={musician} />
                                ))}
                            </div>
                        </section>

                        {/* Lista de músicos filtrados */}
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                <h2 className="text-xl font-bold">Músicos disponibles {filteredMusicians.length > 0 ? `(${filteredMusicians.length})` : ''}</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Ordenar por:</span>
                                    <select className="text-sm border rounded py-1 px-2">
                                        <option>Popularidad</option>
                                        <option>Precio: menor a mayor</option>
                                        <option>Precio: mayor a menor</option>
                                        <option>Calificación</option>
                                    </select>
                                </div>
                            </div>

                            {filteredMusicians.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredMusicians.map(musician => (
                                        <MusicianCard key={musician.id} musician={musician} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 sm:p-8 text-center">
                                    <p className="text-lg">No se encontraron músicos con los filtros seleccionados.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 border-primary hover:bg-primary/10 text-primary"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedGenres([]);
                                            setSelectedInstruments([]);
                                        }}
                                    >
                                        Limpiar filtros
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    ) : null;
} 