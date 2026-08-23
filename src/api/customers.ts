import { get, post, put } from './client';
import type {
  CreateCustomerRequest, CustomerListItemResponse, CustomerResponse, CustomersQuery, PagedResponse,
  UpdateCustomerRequest, Uuid,
} from './dto';

export const listCustomers = (query: CustomersQuery = {}) =>
  get<PagedResponse<CustomerListItemResponse>>('/api/customers', query);
export const getCustomer = (id: Uuid) => get<CustomerResponse>(`/api/customers/${id}`);
export const createCustomer = (body: CreateCustomerRequest) => post<CustomerResponse>('/api/customers', body);
export const updateCustomer = (id: Uuid, body: UpdateCustomerRequest) =>
  put<CustomerResponse>(`/api/customers/${id}`, body);
export const activateCustomer = (id: Uuid) => post<CustomerResponse>(`/api/customers/${id}/activate`);
export const deactivateCustomer = (id: Uuid) => post<CustomerResponse>(`/api/customers/${id}/deactivate`);
