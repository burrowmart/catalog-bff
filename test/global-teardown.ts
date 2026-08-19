import type { Server } from 'node:http';

export default async function globalTeardown(): Promise<void> {
  const catalog = (global as { __CATALOG_STUB__?: Server }).__CATALOG_STUB__;
  await new Promise<void>((resolve) => (catalog ? catalog.close(() => resolve()) : resolve()));
}
