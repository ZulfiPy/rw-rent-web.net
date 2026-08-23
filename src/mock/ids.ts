/** Deterministic-enough uuids for an in-memory store. */
export const newUuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/** Fixed ids so seed rows can reference each other and tests can name them. */
export const ID = {
  company: '0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05',
  users: {
    sysadmin: 'a1f0c8d3-4b27-4e95-8d61-30c7f2a95b18',
    principal: 'b2e1d9c4-5a38-4f06-9e72-41d8a3b06c29',
    fleet: 'c3d2ea05-6b49-4017-8f83-52e9b4c17d3a',
    viewer: 'd4e3fb16-7c5a-4128-90f4-63fac5d28e4b',
    pendingConfirmed: 'e5f40c27-8d6b-4239-a105-740bd6e39f5c',
    pendingUnconfirmed: 'f6051d38-9e7c-434a-b216-851ce7f40a6d',
    rejected: '07162e49-af8d-445b-c327-962df8051b7e',
    suspended: '18273f5a-b09e-456c-d438-a73e09162c8f',
  },
} as const;
