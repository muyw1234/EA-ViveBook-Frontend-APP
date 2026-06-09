
export type SellType = 'VENTA' | 'ALQUILER';
// Faltan muchos modelos -_-
export interface ILibro {
    isbn: string;
    title: string;
    authors?: String[];
    autor?: string;
    categoria?: string;
    type: SellType;
    precio: number;
    estado: string;
    owner?: string;
    IsDeleted?: boolean;
    rentalStartDate?: Date;
    rentalEndDate?: Date;
    imageUrl?: string;
}