import type { CompanyResponse, CreateCompanyRequest, UpdateCompanyRequest } from '@/api/dto';
import { writeAudit } from '../audit';
import { newUuid } from '../ids';
import { notFound, route, type Ctx } from '../transport';
import { conflict, requireText } from '../validate';

const read = (ctx: Ctx): CompanyResponse => {
  if (!ctx.store.company) throw notFound('The operating Company has not been created yet.');
  return ctx.store.company;
};

const fields = (body: CreateCompanyRequest | UpdateCompanyRequest) => ({
  name: requireText(body?.name, 'name', 'Name', 200),
  registrationNumber: requireText(body?.registrationNumber, 'registrationNumber', 'Registration Number', 50),
  vatNumber: body?.vatNumber?.trim() || null,
  legalAddress: requireText(body?.legalAddress, 'legalAddress', 'Legal Address', 2000),
  email: requireText(body?.email, 'email', 'Email', 254),
  phoneNumber: body?.phoneNumber?.trim() || null,
});

route('GET', '/api/companies', (ctx) => read(ctx), ['Company.Read']);

route('POST', '/api/companies', (ctx) => {
  if (ctx.store.company) throw conflict('The operating Company already exists.', 'company.already_exists');
  const now = new Date().toISOString();
  ctx.store.company = { id: newUuid(), ...fields(ctx.body as CreateCompanyRequest), createdAtUtc: now, updatedAtUtc: null };
  writeAudit(ctx.store, {
    eventType: 'Company.Created',
    actorUserId: ctx.me.id,
    entityType: 'Company',
    entityId: ctx.store.company.id,
    after: { Name: ctx.store.company.name, RegistrationNumber: ctx.store.company.registrationNumber },
  });
  return ctx.store.company;
}, ['Company.Create']);

route('PUT', '/api/companies/{id}', (ctx) => {
  const company = read(ctx);
  if (company.id !== ctx.params.id) throw notFound();
  const next = fields(ctx.body as UpdateCompanyRequest);
  const before = {
    Name: company.name,
    RegistrationNumber: company.registrationNumber,
    VatNumber: company.vatNumber ?? null,
    LegalAddress: company.legalAddress,
    Email: company.email,
    PhoneNumber: company.phoneNumber ?? null,
  };
  Object.assign(company, next);
  company.updatedAtUtc = new Date().toISOString();
  writeAudit(ctx.store, {
    eventType: 'Company.Updated',
    actorUserId: ctx.me.id,
    entityType: 'Company',
    entityId: company.id,
    before,
    after: {
      Name: company.name,
      RegistrationNumber: company.registrationNumber,
      VatNumber: company.vatNumber ?? null,
      LegalAddress: company.legalAddress,
      Email: company.email,
      PhoneNumber: company.phoneNumber ?? null,
    },
  });
  return company;
}, ['Company.Update']);

route('DELETE', '/api/companies/{id}', (ctx) => {
  const company = read(ctx);
  if (company.id !== ctx.params.id) throw notFound();
  const referenced =
    ctx.store.users.some((u) => u.companyId === company.id) || ctx.store.assignments.length > 0;
  if (referenced) throw conflict('The Company is still referenced and cannot be deleted.', 'company.referenced');
  writeAudit(ctx.store, {
    eventType: 'Company.Deleted',
    actorUserId: ctx.me.id,
    entityType: 'Company',
    entityId: company.id,
    before: { Name: company.name },
  });
  ctx.store.company = null;
}, ['Company.Delete']);
