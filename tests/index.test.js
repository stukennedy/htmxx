const { parseFiles, callEndpoint } = require('../lib/index');

let files;
beforeAll(async () => {
  files = parseFiles(process.cwd() + '/tests/routes');
});

describe('User Endpoints', () => {
  it('GET / should return HTML', async () => {
    const { markup } = await callEndpoint('/', 'GET', {}, files);
    expect(markup).toEqual(expect.stringContaining('<h1>My Title</h1>'));
    expect(markup).toEqual(expect.stringContaining('<h5>HOME</h5>'));
    expect(markup).toEqual(
      expect.stringContaining('<h3>My Template HOME</h3>')
    );
  });

  it('GET /rougue should show Error HTML', async () => {
    const { markup } = await callEndpoint('/rogue', 'GET', {}, files);
    expect(markup).toEqual(expect.stringContaining('<h1>My Error</h1>'));
  });
});
