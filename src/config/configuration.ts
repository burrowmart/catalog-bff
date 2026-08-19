export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  cognito: {
    issuer: process.env.COGNITO_ISSUER ?? '',
    audience: process.env.COGNITO_AUDIENCE ?? '',
  },
  catalogServiceUrl: process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002',
});
