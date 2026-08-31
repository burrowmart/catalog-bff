export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  catalogServiceUrl: process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002',
});
