import { resolve } from 'path';
import mustache from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import { CheerioAPI, load } from 'cheerio';
import path from 'path';

const re = /(?:\.([^.]+))?$/;

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';

export type Route = {
  path: string;
  route: string;
  name: string;
  hidden: boolean;
  depth: number;
  method: Method;
};

class RedirectError {
  status: number;
  location: string;
  constructor(status: number, location: string) {
    this.status = status;
    this.location = location;
  }
}
type HtmxxFile = {
  path: string;
  route: string;
  name: string;
  hidden: boolean;
  depth: number;
  method: Method;
};

export function getFiles(baseRoute: string, dir: string) {
  const dirents = readdirSync(dir, { withFileTypes: true });
  const reMethod = /\.(.+)\.html$/;
  const files = dirents
    .map((dirent) => {
      const res = resolve(dir, dirent.name);
      const depth =
        (res.match(/\//g) || []).length - (baseRoute.match(/\//g) || []).length;
      const extension = re.exec(dirent.name)?.[1];
      const hidden = dirent.name?.[0] === '_';
      const method =
        reMethod.exec(dirent.name)?.[1].toUpperCase() || ('GET' as Method);
      if (dirent.isDirectory()) {
        return getFiles(baseRoute, res);
      } else {
        return extension === 'html'
          ? {
              path: res,
              route: res
                .replace(baseRoute, '')
                .replace('.html', '')
                .replace('.ws', '')
                .replace('.post', '')
                .replace('.get', '')
                .replace('.put', '')
                .replace('.delete', '')
                .replace('.patch', '')
                .replace('index', ''),
              name: dirent.name,
              hidden,
              depth,
              method,
            }
          : undefined;
      }
    })
    .filter((route) => route) as HtmxxFile[];
  return Array.prototype.concat(...files);
}

export function closestErrorFile(routes: Route[], depth: number) {
  return routes
    .filter((route) => route.name === '_error.html' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

function extractPartials(content: string) {
  const $ = load(content);
  const partials: { id: string; html: string }[] = [];
  $('script[type="text/html"]').each(function () {
    const id: string | undefined = $(this).attr('id');
    const html: string | null = $(this).html();
    if (id && html) {
      partials.push({ id, html });
    }
  });
  $('script[type="text/html"]').replaceWith('');
  return { html: $.html(), partials };
}

const convertRequires = (script: string, filePath: string) => {
  const requireRe = /require\('(\..+)'\)/g;
  const currentDir = path.join(filePath, '..');
  const rootDir = filePath.substring(0, filePath.indexOf('/routes'));

  return script
    .replace(/require\('~\/(.+)'\)/g, `require('${rootDir}/$1')`)
    .replace(requireRe, `require('${currentDir}/$1')`);
};

const getScriptFunction = ($: CheerioAPI, path: string) => {
  const scriptText = $('script[server]').html() || '';
  const functionText = `
    return (async function(req, require, redirect) {
      const { params, body, query } = req;
      ${convertRequires(scriptText, path)}
    })(req, require, redirect)
  `;
  $('script[server]').replaceWith('');
  return new Function('req', 'require', 'redirect', functionText);
};

type FileRequest = {
  params: object;
  body: object;
  query: object;
};
export async function processPath(
  req: FileRequest,
  routes: Route[],
  route: Route,
  doLayout: boolean
) {
  const partials: Record<string, string> = {};
  let ws: string | undefined;
  const files = await Promise.all(
    routes
      .filter(
        (currRoute) =>
          (currRoute.name === '_layout.html' &&
            currRoute.depth <= route.depth) ||
          currRoute.path === route.path
      )
      .sort((a, b) => a.depth - b.depth)
      .map(async ({ name, path }) => {
        const $ = load(readFileSync(path));
        const wsScript = $('script[server]').attr('ws');
        const script = getScriptFunction($, path);
        const { html, partials: localPartials } = extractPartials($.html());
        localPartials.forEach(({ id, html }) => (partials[id] = html));
        const props = await script(
          req,
          require,
          (status: number, location: string) => {
            throw new RedirectError(status, location);
          }
        );
        if (!doLayout && name === '_layout.html') {
          return '<slot></slot>';
        } else {
          ws = wsScript;
          return mustache.render(
            html.replace(/\{\{&gt;/g, '{{>'), // fix cheerio converting template
            props,
            partials
          );
        }
      })
  );
  const markup = files.reduce((stacked, layout) => {
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
  return { ws, markup };
}
