import { CustomerType, type CustomerListItemResponse, type DriverListItemResponse } from '@/api/dto';

/**
 * The customer's driver link, made findable (F7-2).
 *
 * "The customer will drive" needs the customer's own link to a driver record (CUSTOMER-012,
 * `driverId`). The rule is right, and the owner's check on real data found the app no help with
 * it: a private customer and a driver with the same personal ID, phone and email, the option
 * greyed out with "This customer is not registered as a driver" although the driver existed, a
 * customer record reading "Not linked" with nothing to press, and a customer dialog that did not
 * notice the matching driver. The three pieces below are what the screens now say and propose.
 */

/** Why "The customer will drive" is closed for this customer, or null when it is open. */
export interface CustomerDriveBlock {
  message: string;
  /** Where the person can fix it: the customer's record, for a private customer with no link. */
  link?: { to: string; label: string };
}

export const NO_LINKED_DRIVER = 'This customer has no linked driver record.';
export const LINK_ON_RECORD = 'Link one on the customer’s record.';

export function customerDriveBlock(
  customer: Pick<CustomerListItemResponse, 'id' | 'type' | 'driverId'> | null,
): CustomerDriveBlock | null {
  if (!customer) return { message: 'Select a customer first.' };
  if (customer.type === CustomerType.Business) {
    return {
      message: 'A business customer cannot drive personally. Use company-authorized drivers or name a driver.',
    };
  }
  if (customer.driverId) return null;
  return {
    message: NO_LINKED_DRIVER,
    link: { to: `/customers/${customer.id}`, label: LINK_ON_RECORD },
  };
}

/**
 * The driver record to propose as a private customer's link: the active driver whose personal ID
 * equals the one entered, compared as the API stores both (trimmed). Only while the customer has
 * no link, and never chosen for the person — the dialog offers it and they decide.
 */
export function proposedDriverLink<D extends Pick<DriverListItemResponse, 'id' | 'personalId' | 'isActive'>>(
  personalId: string,
  linkedDriverId: string,
  drivers: readonly D[],
): D | null {
  const wanted = personalId.trim();
  if (!wanted || linkedDriverId) return null;
  return drivers.find((d) => d.isActive && (d.personalId ?? '').trim() === wanted) ?? null;
}
