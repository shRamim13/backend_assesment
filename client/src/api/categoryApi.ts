import type {
  ApiResponse,
  CategoryTreeNode,
  CategoryWithAncestors,
  Category,
  DeactivationResult,
  CreateCategoryDto,
  BulkCreateDto,
  HealthStatus,
} from '../types';

const BASE = '/api/categories';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export const api = {
  getFlat: (page?: number, limit?: number, name?: string) => {
  let url = `${BASE}?`;
  if (name) url += `name=${encodeURIComponent(name)}&`;
  if (page) url += `page=${page}&limit=${limit || 10}`;
  if (!name && !page && !limit) url = BASE;
  return fetch(url).then((r) => r.json()) as Promise<ApiResponse<CategoryWithAncestors[]>>;
  },

  getTree: (id?: string) => {
    const url = id ? `${BASE}/tree?id=${id}` : `${BASE}/tree`;
    return request<CategoryTreeNode[]>(url);
  },

  getById: (id: string) => request<CategoryWithAncestors>(`${BASE}/${id}`),

  create: (dto: CreateCategoryDto) =>
    fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then((r) => r.json()) as Promise<ApiResponse<Category>>,

  createBulk: (dto: BulkCreateDto | BulkCreateDto[]) =>
    fetch(`${BASE}/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then((r) => r.json()) as Promise<ApiResponse<Category | Category[]>>,

  update: (id: string, name: string) =>
    request<Category>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),

  delete: (id: string) => request<null>(`${BASE}/${id}`, { method: 'DELETE' }),

  deactivate: (id: string) => request<DeactivationResult>(`${BASE}/${id}/deactivate`, { method: 'PATCH' }),

  activate: (id: string) => request<DeactivationResult>(`${BASE}/${id}/activate`, { method: 'PATCH' }),

  upsert: (dto: CreateCategoryDto) =>
    fetch(`${BASE}/upsert`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then((r) => r.json()) as Promise<ApiResponse<Category>>,

  health: () => fetch('/health').then((r) => r.json()) as Promise<HealthStatus>,
};
