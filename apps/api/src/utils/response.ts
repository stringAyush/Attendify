export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function ApiSuccessResponse<T>(
  data: T,
  message?: string,
  pagination?: PaginationMeta
) {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(pagination && { pagination }),
  };
}

export function ApiErrorResponse(
  statusCode: number,
  error: string,
  details?: Record<string, string[]>
) {
  return {
    success: false,
    error,
    statusCode,
    ...(details && { details }),
  };
}

export function buildPagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function getPaginationParams(query: {
  page?: string | number;
  limit?: string | number;
}): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}
