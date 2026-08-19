/**
 * Jest globalSetup — runs once before any test file is loaded.
 * catalog-bff has no datastore; its only dependency is catalog-service,
 * stood up here as a minimal in-process HTTP stub that echoes back whatever
 * query string it received, so the e2e suite can prove pass-through works.
 */
import { createServer, type Server } from 'node:http';

function startCatalogStub(): Promise<Server> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      if (req.method === 'GET' && req.url?.startsWith('/catalog')) {
        const url = new URL(req.url, 'http://localhost');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            data: [{ id: 'item-1', name: 'Widget', description: 'stub', price: 1000, stock: 5 }],
            total: 1,
            receivedQuery: Object.fromEntries(url.searchParams.entries()),
          }),
        );
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'not found' }));
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function port(server: Server): number {
  const addr = server.address();
  if (typeof addr !== 'object' || addr === null) throw new Error('stub server failed to bind a TCP port');
  return addr.port;
}

export default async function globalSetup(): Promise<void> {
  const catalog = await startCatalogStub();

  process.env.PORT = '3012';
  process.env.AUTH_DISABLED = 'true';
  process.env.CATALOG_SERVICE_URL = `http://127.0.0.1:${port(catalog)}`;

  (global as { __CATALOG_STUB__?: Server }).__CATALOG_STUB__ = catalog;
}
