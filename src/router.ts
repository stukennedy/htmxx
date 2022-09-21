import { resolve } from 'path';
import mustache from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import type { Request } from 'express';
import { transformSync } from '@babel/core';
import { load } from 'cheerio';

const re = /(?:\.([^.]+))?$/;
const reMethod = /\.(.+)\.html$/;

export type Method = 'GET' | 'POST' | 'PUT' | 'UPDATE' | 'DELETE';

export type Route = {
  path: string;
  route: string;
  name: string;
  hidden: boolean;
  depth: number;
  method: Method;
};

export function getFiles(baseRoute: string, dir: string) {
  const dirents = readdirSync(dir, { withFileTypes: true });
  const files: any[] = dirents
    .map((dirent) => {
      const res = resolve(dir, dirent.name);
      const depth =
        (res.match(/\//g) || []).length - (baseRoute.match(/\//g) || []).length;
      const extension = re.exec(dirent.name)?.[1];
      const hidden = dirent.name?.[0] === '_';
      const method = reMethod.exec(dirent.name)?.[1].toUpperCase() || 'GET';
      if (dirent.isDirectory()) {
        return getFiles(baseRoute, res);
      } else {
        return extension === 'html'
          ? {
              path: res,
              route: res
                .replace(baseRoute, '')
                .replace('.html', '')
                .replace('.post', '')
                .replace('.get', '')
                .replace('.update', '')
                .replace('.put', '')
                .replace('.delete', '')
                .replace('index', ''),
              name: dirent.name,
              hidden,
              depth,
              method,
            }
          : undefined;
      }
    })
    .filter((route) => route);
  return Array.prototype.concat(...files);
}

export function closestErrorFile(routes: Route[], depth: number) {
  return routes
    .filter((route) => route.name === '_error.html' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

const evaluateScript = (req: Request, scriptCode: string, path: string) => {
  const { params, query, body } = req;
  const result = transformSync(`(function() {
      const params = ${JSON.stringify(params)};
      const query = ${JSON.stringify(query)};
      const body = ${JSON.stringify(body)};
      ${scriptCode}
    }())`);
  const currentPath = path.substr(0, path.lastIndexOf('/'));
  const code =
    result?.code?.replace("require('.", `require('${currentPath}`) || '';
  return eval(code);
};

type Partial = { id: string; html: string };
function getPartials(content: string) {
  const $ = load(content);
  const partials: { id: string; html: string }[] = [];
  $('script[type="text/html"]').each(function (_, el) {
    const id: string | undefined = $(this).attr('id');
    const html: string | null = $(this).html();
    if (id && html) {
      partials.push({ id, html });
    }
  });
  return partials;
}

export function stackLayouts(req: Request, routes: Route[], route: Route) {
  const partials: Record<string, string> = {};
  const layouts = routes
    .filter(
      (currRoute) =>
        currRoute.name === '_layout.html' && currRoute.depth <= route.depth
    )
    .sort((a, b) => a.depth - b.depth)
    .reduce((stacked: string, layout: Route) => {
      const content = readFileSync(layout.path, 'utf8');
      const $ = load(content);
      const scriptCode = $('script[type="module"]').html();
      const layoutPartials = getPartials(content);
      layoutPartials.forEach(({ id, html }) => (partials[id] = html));
      const exe = scriptCode
        ? evaluateScript(req, scriptCode, route.path)
        : '{}';
      $('script[type="text/html"]').replaceWith(''); // remove all partial templates
      $('script[type="module"]').replaceWith(''); // remove all module scripts
      const output = mustache.render(
        $.html().replace('{{&gt;', '{{>'), // fix cheerio converting template
        exe,
        partials
      );
      if (stacked) {
        const $stack = load(stacked);
        $stack('slot').replaceWith(output);
        return $stack.html();
      } else {
        return output;
      }
    }, '');
  return { partials, layouts };
}

export function processFile(
  req: Request,
  routes: Route[],
  route: Route,
  doLayout: boolean
) {
  const path = route.path;
  const content = readFileSync(path, 'utf8');
  const $ = load(content);
  const scriptCode = $('script[type="module"]').html();
  const { layouts, partials } = stackLayouts(req, routes, route);
  const pagePartials = getPartials(content);
  pagePartials.forEach(({ id, html }) => (partials[id] = html));
  $('script[type="text/html"]').replaceWith(''); // remove all partial templates
  $('script[type="module"]').replaceWith(''); // remove all module scripts
  const exe = scriptCode ? evaluateScript(req, scriptCode, route.path) : '{}';
  const pageOutput = mustache.render(
    $.html().replace('{{&gt;', '{{>'), // fix cheerio converting template
    exe,
    partials
  );
  if (doLayout && layouts !== '') {
    const $stack = load(layouts);
    $stack('slot').replaceWith(pageOutput);
    return $stack.html();
  }
  return pageOutput;
}
