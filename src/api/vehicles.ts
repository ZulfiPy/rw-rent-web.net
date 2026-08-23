import { get, post, put } from './client';
import type {
  CreateVehicleRequest, PagedResponse, UpdateVehicleRequest, VehicleListItemResponse, VehicleResponse,
  VehiclesQuery, Uuid,
} from './dto';

export const listVehicles = (query: VehiclesQuery = {}) =>
  get<PagedResponse<VehicleListItemResponse>>('/api/vehicles', query);
export const getVehicle = (id: Uuid) => get<VehicleResponse>(`/api/vehicles/${id}`);
export const createVehicle = (body: CreateVehicleRequest) => post<VehicleResponse>('/api/vehicles', body);
export const updateVehicle = (id: Uuid, body: UpdateVehicleRequest) =>
  put<VehicleResponse>(`/api/vehicles/${id}`, body);
export const activateVehicle = (id: Uuid) => post<VehicleResponse>(`/api/vehicles/${id}/activate`);
export const deactivateVehicle = (id: Uuid) => post<VehicleResponse>(`/api/vehicles/${id}/deactivate`);
