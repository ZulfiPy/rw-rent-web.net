import { del, get, post, put } from './client';
import type { CompanyResponse, CreateCompanyRequest, UpdateCompanyRequest, Uuid } from './dto';

export const getCompany = () => get<CompanyResponse>('/api/companies');
export const createCompany = (body: CreateCompanyRequest) => post<CompanyResponse>('/api/companies', body);
export const updateCompany = (id: Uuid, body: UpdateCompanyRequest) =>
  put<CompanyResponse>(`/api/companies/${id}`, body);
export const deleteCompany = (id: Uuid) => del<void>(`/api/companies/${id}`);
