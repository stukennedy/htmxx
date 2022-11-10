# HTMXX v5

This is a total rewrite since v4 and not compatible. Going forward; HTMXX will be maintaining this Typescript approach instead of the now deprecated specialist `html` files from pervious versions.

## Back to the future of web development

A zero config full-stack web framework in Typescript using [HTMX](https://htmx.org) and a routing structure.
Reactive and responsive web development with proper [REST](https://htmx.org/essays/rest-explained/) endpoints (i.e. returning HTML not JSON)
And no need for any client-side Javascript. Use [Hyperscript](https://hyperscript.org/) for reactivity.

![todomvc htmx demo gif](todo-demo.gif)

## How to install

```
npm i htmxx
```

Then just point it at a the directory that contains your `routes` folder.
This will contain your web-app file structure used to generate a resource of all the endpoints.
This resource can then be used by your server (e.g. Lambda function or ExpressJS) to render the endpoint.

# How to use

## Express server

```
const { Htmxx } = require('htmxx');
const htmxx = new Htmxx(process.cwd());
htmxx.startServer();
```

## Routes folder

The web-app just consists of a routes folder containing the application routing structure as `Typescript` files, that define the server endpoints.
e.g.

- `src/routes/index.ts` defines a `GET` endpoint at `/`
- `src/routes/customers.post.ts` defines a `POST` endpoint at `/customers`

## Special files

Any Typescript files will be treated as an endpoint unless they begin with an underscore `_` (e.g. `_layout.ts`). `*.ts` is a `GET`, other methods (`POST`, `PUT`, `PATCH`, `DELETE`) are supported in by adding the lowercase prefix to the Typescript extension e.g. `*.post.ts` is a `POST`.
Special files `_layout.ts` and `_error.ts` can be defined anywhere within our routes structure, these serve the following.
purposes:

### Layout files

These files allow nesting of content in your routes structure allowing layouts to be created at any level of the routing tree. They must contain a `${children}` instance inside the HTML template to tell the framework where the content is to be rendered. We add the import for HTMX in the root `_layout.ts` file.

e.g.

```ts
import type { HtmxxRequest } from 'htmxx';

export default (request: HtmxxRequest, children: string) => {
  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://unpkg.com/htmx.org@1.8.0"></script>
        <script src="https://unpkg.com/hyperscript.org@0.0.5"></script>
        <title>HTMXX Demo</title>
      </head>
    </head>
    <body>
      <slot></slot>
    </body>
    </html>
`;
};
```

If we navigate to `/`, the `index.ts` will be rendered in the body.

### Error files

These files are displayed if an error occurs in the app.
An `_error.ts` in the same directory as the error occured or in a directory above will be rendered in the case of an error.

### parameterised filenames

In many routing frameworks you have the ability to define variable path names e.g. `customers/:customerId` so that when a user navigates to `customers/56` the code can retrieve the `customerId` as 56 and load the correct data to display. This framework follows the same principle and it is defined by the folder and file structure.
If we create a folder structure `customers/[customerId]` we can place an `index.ts` in the `customers` folder and another `index.ts` in the `[customerId]` folder, or we could have a file called `[customerId].ts` in the `customers` folder.
The `<script server>` block in `customers/[customerId].ts` or `customers/[customerId]/index.ts` would have access to the `params` variable which will contain `customerId` in this case. To handle a `POST` request for the specific customer you could use `customers/[customerId]/index.post.ts` or `customers/[customerId].post.ts`.

### component files or helpers

Any other Typescript file starting with an underscore `_` will be excluded from the routing, but may be used in the app. This is helpful for creating re-usable components and fragments.

## Writing TS endpoint files

The Typescript endpoint files should export a default method that has `(request: HtmxxRequest, children?: string)` as arguments and return a string containing the rendered HTML, usually as a string literal e.g.

```ts
// src/routes/index.ts

import type { HtmxxRequest } from 'htmxx';
import cust from './customers'; // some model data

export default async (request: HtmxxRequest) => {
  const customers = await cust.getCustomers();

  return /*html*/ `
    <ul id="list">
      {{#customers}}
      <li>{{name}}</li>
      {{/customers}}
    </ul>
    <div>
      <input type="text" name="customerName" />
    </div>
    <button hx-post="/customer" hx-swap="innerHtml" hx-target="#list">
      Add Name
    </button>
  `;
};
```

The `HtmxxRequest` request contains the following attributes.

```ts
type HtmxxRequest = {
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, string | number | undefined>;
  headers: Record<string, string>;
  redirect: (status: number, location: string) => void;
  broadcast: (markup: string) => void;
};
```

(the `children` argument is only used in layout files - see below)

e.g.

## Redirecting from an endpoint

In some cases in your server-side code you may decide you need to redirect to a different route.
to do this, simply call `redirect(statusCode, location)` in your script, the redirect method is available on the `HtmxxRequest`.
e.g.

```ts
import type { HtmxxRequest } from 'htmxx';

export default async ({ redirect }: HtmxxRequest) => {
  redirect(303, '/');
};
```

this will return `{ redirect: { status, location } }` from the `callEndpoint` method. You can use `status` and `location` to do the redirect in your server. (the Express server included, already handles this automatically)

## Websockets

HTMX allows websocket support, so we have added it to our framework.
In your HTMX files you can connect a form submission to a specific websocket endpoint like this

```html
<div hx-ws="connect:/tweet">
  <form hx-ws="send:submit">...</form>
</div>
```

To support this we provide an extra file type `*.ws.ts`. In our example above we would define a websocket file like this:

```ts
// src/routes/tweet.ws.ts
import { HtmxxRequest } from 'htmxx';
import tweets from '~/model/tweets';
import Post from './_post';

export default ({ body }: HtmxxRequest) => {
  const { message, username } = body;
  const tweet = tweets.add(message, username);

  return Post(tweet);
};
```

The body attribute contains the data sent by the form submission, so the code here is no different to writing a normal `POST`. The markup that is rendered is now broadcast on the channel instead of returned in an HTTP response, but the HTMX is handled the same way by the form.

Other endpoints can choose to also broadcast their markup response as well as respond with it by calling the `broadcast` method available on the `HtmxxRequest` argument.
The following `POST` endpoint generates a retweet fragment and broadcasts it to all clients.

```ts
// src/routes/retweet/[id].post.ts

import { HtmxxRequest } from 'htmxx';
import tweets from '~/model/tweets';
import Retweets from './_retweets';

export default ({ params }: HtmxxRequest) => {
  const { id } = body;
  const retweets = model.retweet(id);

  return Retweets(id, retweets);
};
```

See the `examples/twitterClone` folder for the full example.

## Bespoke Server (e.g. serverless)

When using a serverless solution, you will be provided with a function handler that is responding to endpoint requests. In this case express is not a good solution. So you can use the Htmxx `processRoute` method directly without invoking the server. You will need to manage the response in the way your severless platform dictates.

```js
// src/index.js
const { Htmxx } = require('htmxx');

// synchronously generate the list of all endpoints
const htmxx = new Htmxx('/src');
/* the full list of HtmxxFiles is now in htmxx.files */
console.log(htmxx.files);

// when a route is called with a specific method
const req: HtmxxRequest = {
  body, // parsed request body
  params, // parsed request params
  query, // parsed queries
  headers, // parsed header fields
  redirect, // method to redirect the router
  broadcast, // method to broadcast to websockets
};
const markup: string = await htmxx.processRoute(route, method, req);
```

## TODO & Twitter Example

See the `example` folder for a TodoMVC and Twitter Clone implementation in HTMXX running on ExpressJS.

## Resources

- [HTMX Website](https://htmx.org)
- [HTMX Documentation](https://htmx.org/docs)
- [HTMX Discord](https://htmx.org/discord)
- [Hyperscript Website](https://hyperscript.org/)
