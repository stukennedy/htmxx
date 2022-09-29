import { join } from 'path';
import { CheerioAPI } from 'cheerio';
import type { Method, Partial, HtmxxFile } from './interfaces';

export function isHTML(filename: string) {
  const reMethod = /\.html$/;
  return Boolean(reMethod.exec(filename));
}
export function getMethod(filename: string) {
  const reMethod = /\.(.+)\.html$/;
  return reMethod.exec(filename)?.[1].toUpperCase() || ('GET' as Method);
}
export function isHidden(filename: string) {
  return filename?.[0] === '_';
}
export function getEndpoint(filename: string) {
  const reName = /(.+)\..+$/;
  return reName.exec(filename)?.[1].replace('index', '');
}
export function isVariable(filename: string) {
  const reVar = /\/\[.+\]\..+$/;
  return reVar.exec(filename);
}

export function convertRequires(script: string, filePath: string) {
  const requireRe = /require\('(\..+)'\)/g;
  const currentDir = join(filePath, '..');
  const rootDir = filePath.substring(0, filePath.indexOf('/routes'));

  return script
    .replace(/require\('~\/(.+)'\)/g, `require('${rootDir}/$1')`)
    .replace(requireRe, `require('${currentDir}/$1')`);
}

export function closestErrorFile(routes: HtmxxFile[], depth: number) {
  return routes
    .filter((route) => route.name === 'error.html' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

export function extractPartials($: CheerioAPI) {
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

export function getRoute(path: string, baseRoute: string) {
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

export function getParams(route: string, file: HtmxxFile) {
  const paramArray = file.route.match(/\[.+\]/g);
  console.log(route, paramArray);
  if (paramArray) {
    const valueArray = file.routeRe.exec(route)?.slice(1);
    return paramArray.reduce((prev, param, i) => {
      const idx = param.toString().replace(/\[(.+)\]/, '$1');
      if (valueArray?.[i]) {
        prev[idx] = valueArray[i];
      }
      return prev;
    }, {} as Record<string, string>);
  }
  return {} as Record<string, string>;
}

export function buildRouteRegex(route: string) {
  const text = route.replace(/(\[.+?\])/g, '(.+)');
  return new RegExp(text);
}

export function extractScript($: CheerioAPI, path: string) {
  const scriptText = $('script[server]').html() || '';
  return `
    return (async function(req, require, redirect) {
      const { params, body, query } = req;
      ${convertRequires(scriptText, path)}
    })(req, require, redirect)
  `;
}

export function createFunction(script: string) {
  return new Function('req', 'require', 'redirect', script);
}
