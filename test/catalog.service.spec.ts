import { BadGatewayException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { CatalogService } from '../src/catalog/catalog.service';

const config = { get: () => 'http://catalog-service.test' } as unknown as ConfigService;

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: () => 'application/json' },
    json: async () => body,
  } as unknown as Response;
}

describe('CatalogService', () => {
  let service: CatalogService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new CatalogService(config);
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  it('forwards every query param verbatim, reshaping nothing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: [], total: 0, page: 2, limit: 20 }));

    const result = await service.listCatalog({ page: '2', limit: '20', q: 'widget' }, { authorization: 'Bearer tok' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('http://catalog-service.test/catalog?'),
      expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer tok' }) }),
    );
    const [calledUrl] = fetchMock.mock.calls[0];
    const qs = new URL(calledUrl).searchParams;
    expect(qs.get('page')).toBe('2');
    expect(qs.get('limit')).toBe('20');
    expect(qs.get('q')).toBe('widget'); // pass-through, even though the typed client's listItems() doesn't model it
    expect(result).toEqual({ data: [], total: 0, page: 2, limit: 20 });
  });

  it('calls with no query string when no params are given', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: [], total: 0, page: 1, limit: 20 }));

    await service.listCatalog({}, {});

    expect(fetchMock).toHaveBeenCalledWith('http://catalog-service.test/catalog', expect.anything());
  });

  it('throws BadGatewayException when catalog-service errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { message: 'boom' }));

    await expect(service.listCatalog({}, {})).rejects.toThrow(BadGatewayException);
  });
});
