/**
 * catalog-bff e2e verification.
 * catalog-service is a minimal in-process HTTP stub started by
 * test/global-setup.ts (CATALOG_SERVICE_URL) that echoes back the query
 * string it received, proving genuine pass-through.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Catalog (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  const asJson = async <T>(res: Response): Promise<T> => (await res.json()) as T;

  it('GET /health — returns ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await asJson(res)).toEqual({ status: 'ok' });
  });

  it('GET /catalog — forwards page/limit/search params verbatim to catalog-service', async () => {
    const res = await fetch(`${baseUrl}/catalog?page=3&limit=15&q=widget&category=tools`);
    expect(res.status).toBe(200);

    const body = await asJson<{ receivedQuery: Record<string, string>; total: number }>(res);
    expect(body.receivedQuery).toEqual({ page: '3', limit: '15', q: 'widget', category: 'tools' });
    expect(body.total).toBe(1);
  });

  it('GET /catalog — no query params still works', async () => {
    const res = await fetch(`${baseUrl}/catalog`);
    expect(res.status).toBe(200);
    const body = await asJson<{ receivedQuery: Record<string, string> }>(res);
    expect(body.receivedQuery).toEqual({});
  });
});
