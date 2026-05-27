import { PaginationMeta } from '../types/category.types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  pagination?: PaginationMeta;
  timestamp: string;
}

export const ResponseBuilder = {
  success<T>(data: T, message = 'Success', statusCode = 200): ApiResponse<T> {
    return { success: true, statusCode, message, data, timestamp: new Date().toISOString() };
  },

  paginated<T>(data: T, pagination: PaginationMeta, message = 'Success'): ApiResponse<T> {
    return { success: true, statusCode: 200, message, data, pagination, timestamp: new Date().toISOString() };
  },

  created<T>(data: T, message = 'Created successfully'): ApiResponse<T> {
    return ResponseBuilder.success(data, message, 201);
  },

  error(message: string, statusCode = 500): ApiResponse<null> {
    return { success: false, statusCode, message, data: null, timestamp: new Date().toISOString() };
  },

  notFound(resource = 'Resource'): ApiResponse<null> {
    return ResponseBuilder.error(`${resource} not found`, 404);
  },

  badRequest(message: string): ApiResponse<null> {
    return ResponseBuilder.error(message, 400);
  },

  conflict(message: string): ApiResponse<null> {
    return ResponseBuilder.error(message, 409);
  },
};
