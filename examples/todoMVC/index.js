const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { parseFiles, callEndpoint } = require('../../lib/index');

dotenv.config();
const PORT = Number(process.env.PORT || 3000);
const files = parseFiles(process.cwd() + '/routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.use(express.static(process.cwd() + '/assets'));

const getAppMethod = (method, route, callback) => {
  switch (method) {
    case 'DELETE':
      return app.delete(route, callback);
    case 'PUT':
      return app.put(route, callback);
    case 'POST':
      return app.post(route, callback);
    case 'PATCH':
      return app.patch(route, callback);
    default:
      return app.get(route, callback);
  }
};

files.forEach((f) => {
  if (f.hidden) return;
  const route = f.route.replace(/\[(.+)\]/g, ':$1');
  getAppMethod(f.method, route, async (req, res) => {
    const { params, query, body } = req;
    try {
      const { markup } = await callEndpoint(
        f.route,
        f.method,
        { params, query, body },
        files
      );
      res.send(markup);
    } catch (error) {
      // eslint-disable-next-line no-prototype-builtins
      if (error.hasOwnProperty('location')) {
        res.redirect(error.status, error.location);
        return;
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
