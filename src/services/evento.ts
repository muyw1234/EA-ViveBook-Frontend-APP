import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Usamos la nomenclatura GeoJSON precisa de tu versión web
export interface IGeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export interface IParticipant {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

// Interfaz para cuando el backend te devuelve el objeto completo
export interface IEvento {
    _id: string;
    title: string;
    description: string;
    creator: string | { _id: string; name: string; email: string };
    participant: IParticipant[];
    eventDate: string;
    createdDate: string;
    location: IGeoJSONPoint;
    direccionExacta: string;
    IsDeleted?: boolean;
}

// Interfaz necesaria para la carga útil de creación (Payload)
export interface IEventoData {
    _id?: string; 
    title: string;
    description: string;
    creator?: string; // ID del usuario autenticado que lo crea
    participant?: string[];
    eventDate: string; // Formato ISO string adecuado para transporte JSON
    createdDate: string;
    location: IGeoJSONPoint;
    direccionExacta: string;
}

const EventoService = {
    // ➕ MÉTODO NUEVO: Sincronizado con la lógica de tu web
    createEvento: async (eventoData: IEventoData): Promise<IEvento> => {
        try {
            const response = await api.post("/eventos", eventoData);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error al crear el evento desde la app:", error);
            throw error;
        }
    },

    getAllEventos: async (): Promise<IEvento[]> => {
        try {
            const response = await api.get("/eventos");
            const data = response.data;

            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.data)) return data.data;
            if (data && data.data && Array.isArray(data.data.data)) return data.data.data;

            return [];
        } catch (error) {
            console.error("Error al obtener eventos globales:", error);
            throw error;
        }
    },

    getEvento: async (eventoId: string): Promise<IEvento> => {
        const response = await api.get(`/eventos/${eventoId}`);
        return response.data.success ? response.data.data : response.data.data || response.data;
    },

    getEventsAtExactLocation: async (lng: number, lat: number): Promise<IEvento[]> => {
        try {
            const response = await api.get(`/eventos/exact-location`, {
                params: { lng, lat }
            });
            return response.data.success ? response.data.data : response.data.data || response.data;
        } catch (error) {
            console.error("Error fetching events at exact location:", error);
            throw error;
        }
    },

    // Prueba esto en tu EventoService si sigue fallando por temas de autenticación:
participateEvento: async (eventoId: string, usuarioId: string): Promise<IEvento> => {
    const token = await AsyncStorage.getItem('token'); // Recuperamos el token guardado
    const response = await api.put(`/eventos/${eventoId}/participate`, 
        { usuarioId }, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return response.data.success ? response.data.data : response.data.data || response.data;
},

    leaveEvento: async (eventoId: string, usuarioId: string): Promise<IEvento> => {
        const response = await api.put(`/eventos/${eventoId}/leave`, { usuarioId });
        return response.data.success ? response.data.data : response.data.data || response.data;
    }
};

export default EventoService;