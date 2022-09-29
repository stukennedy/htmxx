const Htmxx = require('../lib/index');
const routesDirectory = process.cwd() + '/tests/routes';
const htmxx = new Htmxx(routesDirectory);

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
    const { markup } = await htmxx.processRoute('/rogue', 'GET', {});
    expect(markup).toEqual(expect.stringContaining('<h1>My Error</h1>'));
  });
});
