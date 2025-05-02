"use client";

import { useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import RoleSelectionModal from "@/components/RoleSelectionModal"

// Esquema de validación para el formulario de inicio de sesión
const formSchema = z.object({
    email: z.string().email({
        message: "Ingresa un correo electrónico válido",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres",
    }),
    role: z.enum(["CLIENT", "MUSICIAN"]).optional(),
})

export function SignInForm({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [showRoleSelector, setShowRoleSelector] = useState<boolean>(false)
    const [, setUserData] = useState<Record<string, unknown>>({})
    const [showRoleModal, setShowRoleModal] = useState(false)
    const userId = ""

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            role: undefined,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError(null)
        setLoading(true)

        try {
            // Solo verificamos la selección de rol si estamos en el modo de selección de rol
            if (showRoleSelector && !values.role) {
                setError("Por favor selecciona un rol para continuar")
                setLoading(false)
                return
            }

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Error al iniciar sesión")
            }

            // Si el usuario existe en ambas tablas y no ha seleccionado un rol
            if (data.existsInBothTables && !values.role) {
                setShowRoleSelector(true)
                setUserData(data)
                setLoading(false)
                return
            }

            // Guardar datos de la sesión
            localStorage.setItem("authToken", data.token)
            localStorage.setItem("userData", JSON.stringify(data.user))
            localStorage.setItem("userRole", data.user.role)

            // Redireccionar según el rol del usuario
            if (data.user.role === "MUSICIAN") {
                router.push("/profile")
            } else {
                router.push("/dashboard")
            }
        } catch (error) {
            console.error("Error en inicio de sesión:", error)
            setError(error instanceof Error ? error.message : "Error al iniciar sesión")
        } finally {
            setLoading(false)
        }
    }

    const handleRoleSelection = (role: string) => {
        localStorage.setItem("userRole", role)
        // La redirección ocurre dentro del componente RoleSelectionModal
    }

    return (
        <>
            <div className={cn("w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg dark:bg-gray-900", className)} {...props}>
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Ingresa tus credenciales para acceder
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {showRoleSelector ? (
                    <div className="space-y-6">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-medium">Selecciona tu rol</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tu cuenta está registrada como cliente y como músico. ¿Cómo deseas ingresar?
                            </p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rol</FormLabel>
                                            <Select onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un rol" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CLIENT">Cliente</SelectItem>
                                                    <SelectItem value="MUSICIAN">Músico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? "Iniciando sesión..." : "Continuar"}
                                </Button>
                            </form>
                        </Form>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo electrónico</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="tu@email.com"
                                                {...field}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="******"
                                                {...field}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                            </Button>
                        </form>
                    </Form>
                )}

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ¿No tienes una cuenta?{" "}
                        <Link href="/sign-up" className="text-primary hover:text-primary/90">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>

            {/* Modal de selección de rol */}
            <RoleSelectionModal
                open={showRoleModal}
                onOpenChange={setShowRoleModal}
                onRoleSelect={handleRoleSelection}
                userId={userId}
            />

            <Toaster />
        </>
    )
}