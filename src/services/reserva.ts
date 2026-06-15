import api from './api';
import { getPaginatedData, type PaginatedData } from '../utils/apiResponse';

export type ReservationStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface Reservation {
  _id: string;
  libro: string | Record<string, unknown>;
  usuarioSolicitante: string | Record<string, unknown>;
  propietario: string | Record<string, unknown>;
  estado: ReservationStatus;
  fechaSolicitud: string;
  fechaLimite?: string;
  IsDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const PAGE_SIZE = 50;

const getReservationPage = async (
  endpoint: '/reservas/solicitadas' | '/reservas/recibidas',
  page: number,
): Promise<PaginatedData<Reservation>> => {
  const response = await api.get(endpoint, {
    params: { page, limit: PAGE_SIZE },
  });

  return getPaginatedData<Reservation>(response.data);
};

const getAllReservations = async (
  endpoint: '/reservas/solicitadas' | '/reservas/recibidas',
): Promise<Reservation[]> => {
  const firstPage = await getReservationPage(endpoint, 1);
  const totalPages = firstPage.pagination.totalPages;

  if (totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => getReservationPage(endpoint, index + 2)),
  );

  return [...firstPage.data, ...remainingPages.flatMap((page) => page.data)];
};

export const getSentReservations = (): Promise<Reservation[]> =>
  getAllReservations('/reservas/solicitadas');

export const getReceivedReservations = (): Promise<Reservation[]> =>
  getAllReservations('/reservas/recibidas');
