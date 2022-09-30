const Htmxx = require('../lib/index').default;
const server = require('../lib/server').default;
const routesDirectory = process.cwd() + '/tests/routes';
const supertest = require('supertest');
const htmxx = new Htmxx(routesDirectory);
const requestWithSupertest = supertest(server(htmxx));

describe('User Endpoints', () => {
  it('should get all routes', () => {
    const routes = htmxx.getRoutes();
    expect(routes).toEqual([
      '/dashboard',
      '/dashboard/products/[productId]',
      '/dashboard/products',
      '/error',
      '',
      '/redirect',
      '/rogue',
    ]);
  });

  it('GET / should return HTML', async () => {
    const { markup } = await htmxx.processRoute('/', 'GET', {});
    expect(markup).toEqual(expect.stringContaining('<h1>My Title</h1>'));
    expect(markup).toEqual(expect.stringContaining('<h5>HOME</h5>'));
    expect(markup).toEqual(
      expect.stringContaining('<h3>My Template HOME</h3>')
    );
  });

  it('GET /rougue should show Error HTML', async () => {
    const { redirect } = await htmxx.processRoute('/rogue', 'GET', {});
    expect(redirect).toEqual({ status: 303, location: '/error' });
  });
});

describe('Run server', () => {
  it('GET / should return HTML', async () => {
    const res = await requestWithSupertest.get('/');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('html'));
    expect(res.text).toEqual(expect.stringContaining('<h1>My Title</h1>'));
    expect(res.text).toEqual(expect.stringContaining('<h5>HOME</h5>'));
    expect(res.text).toEqual(
      expect.stringContaining('<h3>My Template HOME</h3>')
    );
  });

  it('GET /rougue should show Error HTML', async () => {
    const res = await requestWithSupertest.get('/rogue');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('html'));
    expect(res.text).toEqual(expect.stringContaining('<h1>My Error</h1>'));
  });
});
