import { describe, expect, test } from 'vitest';
import { CustomerType } from '@/api/dto';
import { LINK_ON_RECORD, NO_LINKED_DRIVER, customerDriveBlock, proposedDriverLink } from './driverLink';

const privateCustomer = { id: 'c1', type: CustomerType.PrivateIndividual, driverId: null };

describe('"The customer will drive" says why it is closed, and where to open it (F7-2)', () => {
  test('a private customer with no link is sent to their own record', () => {
    expect(customerDriveBlock(privateCustomer)).toEqual({
      message: NO_LINKED_DRIVER,
      link: { to: '/customers/c1', label: LINK_ON_RECORD },
    });
    expect(NO_LINKED_DRIVER).toBe('This customer has no linked driver record.');
    expect(LINK_ON_RECORD).toBe('Link one on the customer’s record.');
  });

  test('it no longer says the person is not registered as a driver', () => {
    expect(customerDriveBlock(privateCustomer)?.message).not.toMatch(/not registered as a driver/);
  });

  test('a linked private customer may drive', () => {
    expect(customerDriveBlock({ ...privateCustomer, driverId: 'd1' })).toBeNull();
  });

  test('a business customer and a missing customer keep their own reasons, with no link', () => {
    const business = customerDriveBlock({ id: 'c2', type: CustomerType.Business, driverId: null });
    expect(business?.message).toMatch(/business customer cannot drive personally/);
    expect(business?.link).toBeUndefined();
    expect(customerDriveBlock(null)).toEqual({ message: 'Select a customer first.' });
  });
});

describe('the customer dialog proposes the driver with the same personal ID', () => {
  const drivers = [
    { id: 'd1', personalId: '38001010000', isActive: true },
    { id: 'd2', personalId: '49002020000', isActive: false },
    { id: 'd3', personalId: null, isActive: true },
  ];

  test('an equal personal ID proposes that driver, compared as the API stores it', () => {
    expect(proposedDriverLink('38001010000', '', drivers)?.id).toBe('d1');
    expect(proposedDriverLink('  38001010000 ', '', drivers)?.id).toBe('d1');
  });

  test('nothing is proposed without an equal personal ID', () => {
    expect(proposedDriverLink('38001010001', '', drivers)).toBeNull();
    expect(proposedDriverLink('', '', drivers)).toBeNull();
    expect(proposedDriverLink('   ', '', drivers)).toBeNull();
  });

  test('an inactive driver is never proposed: the link list offers active drivers only', () => {
    expect(proposedDriverLink('49002020000', '', drivers)).toBeNull();
  });

  test('a customer who already has a link is left alone', () => {
    expect(proposedDriverLink('38001010000', 'd1', drivers)).toBeNull();
    expect(proposedDriverLink('38001010000', 'd9', drivers)).toBeNull();
  });
});
