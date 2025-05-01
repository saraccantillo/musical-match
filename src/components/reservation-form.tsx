"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ReservationData {
    eventType: string;
    eventDate: string;
    location: {
        department: string;
        city: string;
    };
    address: string;
    comments: string;
    initialPrice: number;
}

interface ReservationFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ReservationData) => void;
    initialPrice?: number;
    comments: string;
}

export function ReservationForm({ isOpen, onClose, onSubmit, initialPrice = 300000 }: ReservationFormProps) {
    const [reservationData, setReservationData] = useState<ReservationData>({
        eventType: "Matrimonio",
        eventDate: format(new Date(), "yyyy-MM-dd"),
        location: {
            department: "",
            city: ""
        },
        address: "",
        comments: "",
        initialPrice
    });

    const handleInputChange = (field: string, value: string) => {
        setReservationData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLocationChange = (field: "department" | "city", value: string) => {
        setReservationData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {
        console.log("Datos de reserva a enviar:", reservationData); // Verifica aquí
        try {
            const response = await fetch("/api/reservations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}` // Si necesitas autenticación
                },
                body: JSON.stringify(reservationData),
            });

            if (!response.ok) {
                throw new Error("Error al crear la reserva");
            }

            const data = await response.json();
            console.log("Reserva creada:", data);
            onClose(); // Cerrar el diálogo después de crear la reserva
        } catch (error) {
            console.error("Error al enviar la reserva:", error);
        }
    };

    const eventTypes = [
        "Matrimonio",
        "Fiesta Privada",
        "Evento Corporativo",
        "Graduación",
        "Cumpleaños",
        "Otro"
    ];

    // Lista de departamentos de Colombia (simplificada)
    const departments = [
        "Antioquia",
        "Atlántico",
        "Bogotá D.C.",
        "Bolívar",
        "Boyacá",
        "Caldas",
        "Risaralda",
        "Valle del Cauca"
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reservar Artista</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="eventType">Tipo de evento</Label>
                        <Select
                            value={reservationData.eventType}
                            onValueChange={(value) => handleInputChange("eventType", value)}
                        >
                            <SelectTrigger id="eventType">
                                <SelectValue placeholder="Selecciona el tipo de evento" />
                            </SelectTrigger>
                            <SelectContent>
                                {eventTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="eventDate">Fecha de realización</Label>
                        <div className="relative">
                            <Input
                                id="eventDate"
                                type="date"
                                value={reservationData.eventDate}
                                onChange={(e) => handleInputChange("eventDate", e.target.value)}
                                className="pl-10"
                            />
                            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="department">Departamento</Label>
                            <Select
                                value={reservationData.location.department}
                                onValueChange={(value) => handleLocationChange("department", value)}
                            >
                                <SelectTrigger id="department">
                                    <SelectValue placeholder="Departamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <Select
                                value={reservationData.location.city}
                                onValueChange={(value) => handleLocationChange("city", value)}
                            >
                                <SelectTrigger id="city">
                                    <SelectValue placeholder="Ciudad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ciudad1">Ciudad 1</SelectItem>
                                    <SelectItem value="ciudad2">Ciudad 2</SelectItem>
                                    <SelectItem value="ciudad3">Ciudad 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            value={reservationData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Ingresa la dirección del evento"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="comments">Comentarios adicionales</Label>
                        <Textarea
                            id="comments"
                            value={reservationData.comments}
                            onChange={(e) => handleInputChange("comments", e.target.value)}
                            placeholder="Detalles del evento, requerimientos, etc."
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Tarifa inicial <span className="text-xs text-gray-500">(Definida por el artista)</span></Label>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">COP</span>
                            <Input
                                disabled
                                value={reservationData.initialPrice.toLocaleString()}
                                className="font-semibold"
                            />
                        </div>
                        <p className="text-xs text-gray-500 italic">Este precio podría modificarse más adelante</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Reservar artista</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 