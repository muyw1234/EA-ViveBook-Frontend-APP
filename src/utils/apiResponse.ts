export type ApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedData<T> = {
  data: T[];
  pagination: Pagination;
};

const EMPTY_PAGINATION: Pagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const unwrapApiData = <T>(payload: unknown): T => {
  if (isRecord(payload) && typeof payload.success === 'boolean' && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
};

export const getApiCollection = <T>(payload: unknown): T[] => {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data as T[];
  }

  return [];
};

export const getPaginatedData = <T>(payload: unknown): PaginatedData<T> => {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    return {
      data: data as T[],
      pagination: { ...EMPTY_PAGINATION, total: data.length },
    };
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return {
      data: data.data as T[],
      pagination: isRecord(data.pagination)
        ? {
            total: Number(data.pagination.total) || 0,
            page: Number(data.pagination.page) || 1,
            limit: Number(data.pagination.limit) || 10,
            totalPages: Number(data.pagination.totalPages) || 1,
          }
        : { ...EMPTY_PAGINATION, total: data.data.length },
    };
  }

  return { data: [], pagination: EMPTY_PAGINATION };
};
