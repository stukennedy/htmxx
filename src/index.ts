import { resolve, join } from 'path';
import mustache from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import { CheerioAPI, load } from 'cheerio';
import type { HtmxxFile, Method, Partial, HtmxxRequest } from './interfaces';

class RedirectError {
  status: number;
  location: string;
  constructor(status: number, location: string) {
    this.status = status;
    this.location = location;
  }
}

const convertRequires = (script: string, filePath: string) => {
  const requireRe = /require\('(\..+)'\)/g;
  const currentDir = join(filePath, '..');
  const rootDir = filePath.substring(0, filePath.indexOf('/routes'));

  return script
    .replace(/require\('~\/(.+)'\)/g, `require('${rootDir}/$1')`)
    .replace(requireRe, `require('${currentDir}/$1')`);
};

function closestErrorFile(routes: HtmxxFile[], depth: number) {
  return routes
    .filter((route) => route.name === '_error.html' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

function extractPartials($: CheerioAPI) {
  const partials: Partial[] = [];
  $('script[type="text/html"]').each(function () {
    const id: string | undefined = $(this).attr('id');
    const html: string | null = $(this).html();
    if (id && html) {
      partials.push({ id, html });
    }
  });
  return partials;
}

function getRoute(path: string, baseRoute: string) {
  return path
    .replace(baseRoute, '')
    .replace('.html', '')
    .replace('.ws', '')
    .replace('.post', '')
    .replace('.get', '')
    .replace('.put', '')
    .replace('.delete', '')
    .replace('.patch', '')
    .replace('index', '');
}

const extractScript = ($: CheerioAPI, path: string) => {
  const scriptText = $('script[server]').html() || '';
  return `
    return (async function(req, require, redirect) {
      const { params, body, query } = req;
      ${convertRequires(scriptText, path)}
    })(req, require, redirect)
  `;
};

const createFunction = (script: string) =>
  new Function('req', 'require', 'redirect', script);

export function parseFiles(baseRoute: string, currentDir?: string) {
  const dir = currentDir ?? baseRoute;
  const dirents = readdirSync(dir, { withFileTypes: true });
  const reMethod = /\.(.+)\.html$/;
  const reExt = /(?:\.([^.]+))?$/;
  const files = dirents
    .map((dirent) => {
      const path = resolve(dir, dirent.name);
      const depth =
        (path.match(/\//g) || []).length -
        (baseRoute.match(/\//g) || []).length;
      const extension = reExt.exec(dirent.name)?.[1];
      const hidden = dirent.name?.[0] === '_';
      const method =
        reMethod.exec(dirent.name)?.[1].toUpperCase() || ('GET' as Method);
      if (dirent.isDirectory()) {
        return parseFiles(baseRoute, path);
      } else {
        const $ = load(readFileSync(path));
        const route = getRoute(path, baseRoute);
        const ws = $('script[server]').attr('ws');
        const script = extractScript($, path);
        const partials = extractPartials($);
        return extension === 'html'
          ? {
              path,
              route,
              name: dirent.name,
              hidden,
              depth,
              method,
              script,
              partials,
              ws,
            }
          : undefined;
      }
    })
    .filter((route) => route) as HtmxxFile[];
  return Array.prototype.concat(...files);
}

async function processPath(
  req: HtmxxRequest,
  files: HtmxxFile[],
  file: HtmxxFile
) {
  const stackPartials: Record<string, string> = {};
  let isWs: boolean | undefined;
  const stacks = await Promise.all(
    files
      .filter(
        (currRoute) =>
          (currRoute.name === '_layout.html' &&
            currRoute.depth <= file.depth) ||
          currRoute.path === file.path
      )
      .sort((a, b) => a.depth - b.depth)
      .map(async ({ name, script, path, partials, ws }) => {
        partials.forEach(({ id, html }) => (stackPartials[id] = html));
        const fn = createFunction(script);
        const props = await fn(
          req,
          require,
          (status: number, location: string) => {
            throw new RedirectError(status, location);
          }
        );
        if (file.method !== 'GET' && name === '_layout.html') {
          return '<slot></slot>';
        }
        isWs = Boolean(ws);
        const $ = load(readFileSync(path));
        $('script[type="text/html"]').replaceWith('');
        $('script[server]').replaceWith('');
        const html = $.html().replace(/\{\{&gt;/g, '{{>');
        return mustache.render(html, props, stackPartials);
      })
  );
  const markup = stacks.reduce((stacked, layout) => {
    if (stacked) {
      const $stack = load(stacked);
      if (layout) {
        $stack('slot').replaceWith(layout);
      }
      return $stack.html();
    } else {
      return layout;
    }
  }, '');
  return { ws: isWs || file.method === 'WS', markup };
}

type Output = { ws?: boolean; markup?: string; redirect?: RedirectError };
export async function callEndpoint(
  route: string,
  method: Method,
  req: HtmxxRequest,
  files: HtmxxFile[]
) {
  const file = files.find(
    (file) => file.route === route && file.method === method
  );
  if (!file || file.hidden) {
    console.error('route not defined');
    return;
  }
  let output = {} as Output;
  try {
    output = await processPath(req, files, file);
  } catch (error) {
    // eslint-disable-next-line no-prototype-builtins
    if (error?.hasOwnProperty('location')) {
      return { redirect: error as RedirectError };
    }
    const errorFile = closestErrorFile(files, file.depth);
    output = errorFile
      ? await processPath(req, files, errorFile)
      : { markup: mustache.render('<div>{{error}}</div>', { error }) };
  }
  return output;
}
