/** Deterministic-enough uuids for an in-memory store. */
export const newUuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/**
 * Fixed ids for the ported prototype seed. Keys are the prototype's own identifiers so a row here
 * can be checked against `DB` in RW-Rent.dc.html by name; values are uuids because that is what the
 * API returns. The trailing block of each uuid repeats the number, so a row stays recognisable in a
 * payload or a URL.
 *
 *   u1  Arturs Veidenbaums    System Administrator, protected
 *   u2  Signe Priede          Company Principal
 *   u3  Karlis Zvaigzne       Fleet Manager
 *   u4  Dita Smite            Fleet Manager + Viewer, the name-correction and role-history subject
 *   u5  Toms Rudzitis         Viewer, activated from a registration
 *   u6  Liga Brice            Pending activation, email confirmed
 *   u7  Gatis Lapsa           Pending activation, email confirmed
 *   u8  Zane Upite            Pending activation, email NOT confirmed, registration window open
 *   u9  Imants Gailis         Registration rejected
 *   u10 Baiba Krastina        Registration expired
 *   u11 Raivis Dumins         Suspended, sessions revoked
 */
/** Referenced by audit rows and by the fleet seed; kept so both name the same row. */
const A1 = '2d7b5c86-0001-4f60-9a06-000000000001';
const Z2 = '8b4e6d97-0002-4a70-8b07-000000000002';

/**
 * One uuid per prototype key, in the key order given: the row's ordinal is repeated in the last
 * block, so `v7` stays recognisable in a payload or a URL. Literal keys, so a lookup is a known
 * property rather than an index read.
 */
const fleetIds = <K extends string>(keys: readonly K[], head: string): Record<K, string> => {
  const out = {} as Record<K, string>;
  keys.forEach((key, i) => {
    const nn = String(i + 1).padStart(4, '0');
    out[key] = `${head}-${nn}-4${head.slice(0, 3)}-9${head.slice(0, 3)}-${nn.padStart(12, '0')}`;
  });
  return out;
};

export const ID = {
  company: '0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05',
  users: {
    u1: '9f2b7c41-0001-4a10-8b01-000000000001',
    u2: '9f2b7c41-0002-4a10-8b01-000000000002',
    u3: '9f2b7c41-0003-4a10-8b01-000000000003',
    u4: '9f2b7c41-0004-4a10-8b01-000000000004',
    u5: '9f2b7c41-0005-4a10-8b01-000000000005',
    u6: '9f2b7c41-0006-4a10-8b01-000000000006',
    u7: '9f2b7c41-0007-4a10-8b01-000000000007',
    u8: '9f2b7c41-0008-4a10-8b01-000000000008',
    u9: '9f2b7c41-0009-4a10-8b01-000000000009',
    u10: '9f2b7c41-0010-4a10-8b01-000000000010',
    u11: '9f2b7c41-0011-4a10-8b01-000000000011',
  },
  sessions: {
    s1: '7c3d9e52-0001-4b20-9c02-000000000001',
    s2: '7c3d9e52-0002-4b20-9c02-000000000002',
    s3: '7c3d9e52-0003-4b20-9c02-000000000003',
    s4: '7c3d9e52-0004-4b20-9c02-000000000004',
    s5: '7c3d9e52-0005-4b20-9c02-000000000005',
    s6: '7c3d9e52-0006-4b20-9c02-000000000006',
    s7: '7c3d9e52-0007-4b20-9c02-000000000007',
    s8: '7c3d9e52-0008-4b20-9c02-000000000008',
    s9: '7c3d9e52-0009-4b20-9c02-000000000009',
    s10: '7c3d9e52-0010-4b20-9c02-000000000010',
    s11: '7c3d9e52-0011-4b20-9c02-000000000011',
    s12: '7c3d9e52-0012-4b20-9c02-000000000012',
    s13: '7c3d9e52-0013-4b20-9c02-000000000013',
    s14: '7c3d9e52-0014-4b20-9c02-000000000014',
    s15: '7c3d9e52-0015-4b20-9c02-000000000015',
  },
  roles: {
    r1: '5a8f1d63-0001-4c30-8d03-000000000001',
    r2: '5a8f1d63-0002-4c30-8d03-000000000002',
    r3: '5a8f1d63-0003-4c30-8d03-000000000003',
    /** The prototype's r3b: an expired Viewer grant that was never revoked. */
    r3b: '5a8f1d63-0031-4c30-8d03-000000000031',
    r4: '5a8f1d63-0004-4c30-8d03-000000000004',
    r5: '5a8f1d63-0005-4c30-8d03-000000000005',
    r6: '5a8f1d63-0006-4c30-8d03-000000000006',
  },
  audit: {
    g1: '3e6a2f74-0001-4d40-9e04-000000000001',
    g2: '3e6a2f74-0002-4d40-9e04-000000000002',
    g3: '3e6a2f74-0003-4d40-9e04-000000000003',
    g4: '3e6a2f74-0004-4d40-9e04-000000000004',
    g5: '3e6a2f74-0005-4d40-9e04-000000000005',
    g6: '3e6a2f74-0006-4d40-9e04-000000000006',
    g7: '3e6a2f74-0007-4d40-9e04-000000000007',
    g8: '3e6a2f74-0008-4d40-9e04-000000000008',
    g9: '3e6a2f74-0009-4d40-9e04-000000000009',
    g10: '3e6a2f74-0010-4d40-9e04-000000000010',
    g11: '3e6a2f74-0011-4d40-9e04-000000000011',
    g12: '3e6a2f74-0012-4d40-9e04-000000000012',
    g13: '3e6a2f74-0013-4d40-9e04-000000000013',
  },
  /** Referenced by audit rows only; the records themselves live in the maps below. */
  entities: {
    a1: A1,
    z2: Z2,
  },
  /* Fleet rows, ported from the prototype's DB with its own keys. */
  vehicles: fleetIds(['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10'], '1a5c8e30'),
  customers: fleetIds(['cu1', 'cu2', 'cu3', 'cu4', 'cu5', 'cu6', 'cu7', 'cu8'], '4d9f2a61'),
  drivers: fleetIds(['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'], '6e1b3f72'),
  assignments: {
    ...fleetIds(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11', 'a12'], '2d7b5c86'),
    a1: A1,
  },
  authorizations: { ...fleetIds(['z1', 'z2', 'z3', 'z4', 'z5', 'z6'], '8b4e6d97'), z2: Z2 },
  interruptions: fleetIds(['i1', 'i2', 'i3', 'i4'], '9c5f7e08'),
} as const;
