const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const Htmxx = require('../../lib/index');
const htmxx = new Htmxx(process.cwd() + '/routes');

dotenv.config();
const PORT = Number(process.env.PORT || 3000);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.use(express.static(process.cwd() + '/assets'));

app.all('*', async (req, res) => {
  const request = {
    query: req.query,
    body: req.body,
  };
  const { redirect, markup } = await htmxx.processRoute(
    req.params['0'],
    req.method,
    request
  );
  if (redirect) {
    res.redirect(redirect.status, redirect.location);
    return;
  }
  return res.send(markup);
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
