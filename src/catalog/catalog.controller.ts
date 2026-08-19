import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { forwardAuthHeaders } from '../common/auth/forward-auth-headers.helper';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get()
  @ApiOkResponse({
    description: 'Catalog page from catalog-service; page/limit and any search params pass through verbatim',
  })
  list(@Query() query: Record<string, string>, @Headers() headers: Record<string, string>) {
    return this.service.listCatalog(query, forwardAuthHeaders(headers));
  }
}
