import type { HtmxxRequest } from '../../../lib/interfaces';

export default (_: HtmxxRequest, children: string) => {
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>Twitter clone in htmx</title>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl"
        crossorigin="anonymous"
      />
      <script src="https://unpkg.com/htmx.org@1.3.1"></script>
      <script src="https://unpkg.com/hyperscript.org@0.0.5"></script>
    </head>
    <body>
      ${children}
    </body>
  </html>`;
};
