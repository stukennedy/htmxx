const express = require('express');
const expressWs = require('express-ws');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { parseFiles, callEndpoint } = require('../../lib/index');

dotenv.config();
const PORT = Number(process.env.PORT || 3000);
const files = parseFiles(process.cwd() + '/routes');

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

files.forEach((f) => {
  getAppMethod(f.method, f.route, async (req, res) => {
    if (f.method === 'WS') {
      req.on('message', async (msg) => {
        const body = JSON.parse(msg || '{}');
        const { markup } = await callEndpoint(
          f.route,
          f.method,
          { body },
          files
        );
        appWs.getWss().clients.forEach((client) => {
          if (client.OPEN) {
            client.send(markup);
          }
        });
      });
    } else {
      try {
        const { ws, markup } = await callEndpoint(
          f.route,
          f.method,
          req,
          files
        );
        if (ws !== undefined) {
          appWs.getWss().clients.forEach((client) => {
            if (client.OPEN) {
              client.send(markup);
            }
          });
        }
        res.send(markup);
      } catch (error) {
        // eslint-disable-next-line no-prototype-builtins
        if (error.hasOwnProperty('location')) {
          res.redirect(error.status, error.location);
          return;
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
