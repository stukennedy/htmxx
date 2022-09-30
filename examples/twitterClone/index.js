const express = require('express');
const expressWs = require('express-ws');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const Htmxx = require('../../lib/index');
const htmxx = new Htmxx(process.cwd() + '/routes');

dotenv.config();
const PORT = Number(process.env.PORT || 3000);

const app = express();
const appWs = expressWs(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');

const getAppMethod = (method, route, callback) => {
  const paramRoute = route.replace(/\[(.+)\]/g, ':$1');
  switch (method) {
    case 'DELETE':
      return app.delete(paramRoute, callback);
    case 'PUT':
      return app.put(paramRoute, callback);
    case 'POST':
      return app.post(paramRoute, callback);
    case 'PATCH':
      return app.patch(paramRoute, callback);
    case 'WS':
      return app.ws(paramRoute, callback);
    default:
      return app.get(paramRoute, callback);
  }
};

htmxx.files.forEach((f) => {
  if (f.hidden) return;
  getAppMethod(f.method, f.route, async (req, res) => {
    if (f.method === 'WS') {
      req.on('message', async (msg) => {
        const body = JSON.parse(msg || '{}');
        const { markup } = await htmxx.processRoute(f.route, f.method, {
          body,
        });
        appWs.getWss().clients.forEach((client) => {
          if (client.OPEN) {
            client.send(markup);
          }
        });
      });
    } else {
      const { ws, markup, redirect } = await htmxx.processRoute(
        req.originalUrl,
        f.method,
        req
      );
      if (ws !== undefined) {
        appWs.getWss().clients.forEach((client) => {
          if (client.OPEN) {
            client.send(markup);
          }
        });
      }
      res.send(markup);
      if (redirect) {
        res.redirect(redirect.status, redirect.location);
        return;
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
