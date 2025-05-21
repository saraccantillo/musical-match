"use client";

import Link from "next/link";
import { Search, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";

// Definición de los tipos de usuario
type UserRole = "CLIENT" | "MUSICIAN" | "ADMIN" | null;

interface NavbarProps {
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
}

export function Navbar({ searchTerm = "", onSearchChange }: NavbarProps) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const router = useRouter();

    useEffect(() => {
        // Comprobar autenticación en el cliente
        const storedToken = localStorage.getItem("authToken");
        const storedRole = localStorage.getItem("userRole");

        if (storedToken) {
            setIsAuthenticated(true);
        }

        if (storedRole) {
            setUserRole(storedRole as UserRole);
        }
    }, []);

    // Función para cerrar el menú móvil
    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    // Función para manejar los clics en los elementos del menú desplegable
    const handleMenuItemClick = () => {
        setIsDropdownOpen(false);
    };

    // Función para determinar la URL de edición de perfil según el rol
    const getEditProfileUrl = () => {
        if (userRole === "MUSICIAN") {
            return "/profile/edit/musician";
        } else if (userRole === "CLIENT") {
            return "/profile/edit/client";
        } else {
            return "/profile/edit";
        }
    };

    // Función para manejar el cierre de sesión
    const handleLogout = () => {
        // Eliminar los datos de sesión
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        localStorage.removeItem("userRole");

        // Redireccionar al login
        router.push("/sign-in");

        // Cerrar el menú desplegable
        handleMenuItemClick();
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-800 shadow-sm">
            <div className="container mx-auto px-4">
                {/* Versión móvil */}
                <div className="flex items-center justify-between h-16 md:hidden">
                    <Link href="/" className="flex items-center">
                        <span className="text-xl font-bold text-primary dark:text-primary-foreground">
                            MusicalMatch
                        </span>
                    </Link>

                    <button
                        className="rounded-md p-2 text-foreground hover:bg-muted"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={isMenuOpen}
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
                            {isMenuOpen ? (
                                <>
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </>
                            ) : (
                                <>
                                    <line x1="4" y1="8" x2="20" y2="8" />
                                    <line x1="4" y1="16" x2="20" y2="16" />
                                </>
                            )}
                        </svg>
                    </button>
                </div>

                {/* Panel móvil desplegable */}
                <div className={`md:hidden py-4 space-y-4 ${isMenuOpen ? 'block' : 'hidden'}`}>
                    {/* Barra de búsqueda en móvil - solo para clientes y no en la página de inicio */}
                    {(userRole === "CLIENT" || !isAuthenticated) && pathname !== '/' && (
                        <div className="w-full">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-4 py-2 rounded-full border border-input bg-white text-foreground"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            </div>
                        </div>
                    )}

                    {/* Navegación en móvil */}
                    <div className="flex flex-col gap-2">
                        {isAuthenticated ? (
                            <>
                                <Button variant="ghost" className="text-sm w-full justify-start text-foreground hover:text-primary hover:bg-primary/10" onClick={closeMenu}>
                                    <Link href="/profile" className="w-full text-left">Mi Perfil</Link>
                                </Button>

                                {userRole === "CLIENT" && (
                                    <>
                                        <Button variant="ghost" className="text-sm w-full justify-start text-foreground hover:text-primary hover:bg-primary/10" onClick={closeMenu}>
                                            <Link href="/dashboard" className="w-full text-left">Dashboard</Link>
                                        </Button>
                                        <Button variant="ghost" className="text-sm w-full justify-start text-foreground hover:text-primary hover:bg-primary/10" onClick={closeMenu}>
                                            <Link href="/reservations" className="w-full text-left">Mis Reservas</Link>
                                        </Button>
                                        <Button variant="ghost" className="text-sm w-full justify-start text-foreground hover:text-primary hover:bg-primary/10" onClick={closeMenu}>
                                            <Link href="/favorites" className="w-full text-left">Favoritos</Link>
                                        </Button>
                                    </>
                                )}

                                <Button className="w-full text-sm bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleLogout}>
                                    Cerrar Sesión
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button className="w-full text-sm bg-primary hover:bg-primary/90 text-primary-foreground" onClick={closeMenu}>
                                    <Link href="/sign-in" className="w-full text-center">Iniciar Sesión</Link>
                                </Button>
                                <Button variant="outline" className="w-full text-sm" onClick={closeMenu}>
                                    <Link href="/sign-up" className="w-full text-center">Registrarse</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Versión desktop (siempre visible en md+) */}
                <div className="hidden md:flex items-center justify-between h-16">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center mr-4">
                            <span className="text-2xl font-bold text-primary dark:text-primary-foreground">
                                MusicalMatch
                            </span>
                        </Link>
                    </div>

                    {/* Barra de búsqueda central que ocupa la mayor parte del espacio - solo para clientes y no en la página de inicio */}
                    {(userRole === "CLIENT" || !isAuthenticated) && pathname !== '/' && (
                        <div className="flex-1 max-w-3xl mx-4">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Buscar por nombre, género, instrumento o ubicación..."
                                    className="w-full pl-10 pr-4 py-2 rounded-full border border-input bg-white text-foreground"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            </div>
                        </div>
                    )}

                    {/* Botones de navegación */}
                    <div className="flex items-center gap-2">
                        {isAuthenticated ? (
                            <>
                                {userRole === "CLIENT" && (
                                    <>
                                        <Button variant="ghost" className="text-sm text-foreground hover:text-primary hover:bg-primary/10">
                                            <Link href="/reservations">Mis Reservas</Link>
                                        </Button>
                                        <Button variant="ghost" className="text-sm text-foreground hover:text-primary hover:bg-primary/10">
                                            <Link href="/favorites">Favoritos</Link>
                                        </Button>
                                    </>
                                )}

                                {/* Menú de perfil desplegable */}
                                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <User className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleMenuItemClick}>
                                            <Link href="/profile" className="w-full">
                                                Ver Perfil
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleMenuItemClick}>
                                            <Link href={getEditProfileUrl()} className="w-full">
                                                Editar Perfil
                                            </Link>
                                        </DropdownMenuItem>

                                        {userRole === "CLIENT" && (
                                            <DropdownMenuItem onClick={handleMenuItemClick}>
                                                <Link href="/dashboard" className="w-full">
                                                    Dashboard
                                                </Link>
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Cerrar Sesión</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Button className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Link href="/sign-in">Iniciar Sesión</Link>
                                </Button>
                                <Button variant="outline" className="text-sm">
                                    <Link href="/sign-up">Registrarse</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
} 