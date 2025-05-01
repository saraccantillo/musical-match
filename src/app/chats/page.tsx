"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatHistory } from "@/components/chat-history";
import { getUserSession } from "@/lib/auth";

export default function ChatsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const musicianId = searchParams.get('musicianId');

    useEffect(() => {
        async function checkSession() {
            const session = await getUserSession();
            if (!session) {
                router.push('/sign-in');
                return;
            }
            setUserRole(session.role);
            setIsLoading(false);
        }

        checkSession();
    }, [router]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-10">
                <div className="text-center">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Mis Conversaciones</CardTitle>
                    <CardDescription>
                        Gestiona tus conversaciones con {userRole === "CLIENT" ? "músicos" : "clientes"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChatHistory
                        showOnlyChats={true}
                        showChatsHeader={false}
                        initialMusicianId={musicianId}
                    />
                </CardContent>
            </Card>

            <div className="mt-4 flex justify-end">
                <Button
                    variant="outline"
                    onClick={() => router.push('/reservations')}
                >
                    Ver mis Reservaciones
                </Button>
            </div>
        </div>
    );
} 