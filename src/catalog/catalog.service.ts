import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createFetchClient, FetchError, type CatalogItem, type Paginated } from '@demo/contracts';
import { getCorrelationId } from '../common/correlation/correlation.context';

@Injectable()
export class CatalogService {
  constructor(private readonly config: ConfigService) {}

  // Fresh client per call: correlationId lives in AsyncLocalStorage and
  // changes per request. authHeaders forwards the caller's own credential —
  // catalog-service's Envoy PEP sidecar verifies the Cognito JWT signature
  // (the app guard only extracts identity), so a request arriving without
  // it would be denied in a real deployment.
  private client(authHeaders: Record<string, string>) {
    return createFetchClient({
      baseUrl: this.config.get<string>('catalogServiceUrl')!,
      defaultHeaders: { ...authHeaders, ...this.correlationHeaders() },
    });
  }

  private correlationHeaders(): Record<string, string> {
    const id = getCorrelationId();
    return id ? { 'x-correlation-id': id } : {};
  }

  /**
   * Pure pass-through: every query param the client sent (page, limit, and
   * any search/filter params catalog-service may add later) is forwarded
   * verbatim. catalog-bff reshapes nothing and holds no domain logic — the
   * typed listItems() helper in @demo/contracts only models page/limit, so
   * this uses the untyped client directly to stay a genuine pass-through.
   */
  async listCatalog(
    query: Record<string, string>,
    authHeaders: Record<string, string>,
  ): Promise<Paginated<CatalogItem>> {
    const qs = new URLSearchParams(query).toString();
    try {
      return await this.client(authHeaders).get<Paginated<CatalogItem>>(`/catalog${qs ? `?${qs}` : ''}`);
    } catch (err) {
      if (err instanceof FetchError) {
        throw new BadGatewayException(`catalog-service returned ${err.status}`);
      }
      throw new BadGatewayException('catalog-service unavailable');
    }
  }
}
