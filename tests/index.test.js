const supertest = require('supertest');
const htmxx = require('../lib/index');

let requestWithSupertest;
beforeAll(async () => {
  const server = await htmxx('/tests/routes');
  requestWithSupertest = supertest(server);
});

describe('User Endpoints', () => {
  it('GET / should return HTML', async () => {
    const res = await requestWithSupertest.get('/');
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining('html'));
    expect(res.text).toEqual(expect.stringContaining('<h5>HOME</h5>'));
    expect(res.text).toEqual(
      expect.stringContaining('<h3>My Template HOME</h3>')
    );
  });
});
