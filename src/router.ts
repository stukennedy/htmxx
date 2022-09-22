import { resolve } from 'path';
import mustache from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import type { Request, Response } from 'express';
import { transformSync } from '@babel/core';
import { load } from 'cheerio';

const re = /(?:\.([^.]+))?$/;

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
  const reMethod = /\.(.+)\.html$/;
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

function extractPartials(content: string) {
  const $ = load(content);
  const partials: { id: string; html: string }[] = [];
  $('script[type="text/html"]').each(function (_, el) {
    const id: string | undefined = $(this).attr('id');
    const html: string | null = $(this).html();
    if (id && html) {
      partials.push({ id, html });
    }
  });
  $('script[type="text/html"]').replaceWith('');
  return { html: $.html(), partials };
}

export async function processPath(
  req: Request,
  res: Response,
  routes: Route[],
  route: Route,
  doLayout: boolean
) {
  const partials: Record<string, string> = {};
  const files = await Promise.all(
    routes
      .filter(
        (currRoute) =>
          (doLayout &&
            currRoute.name === '_layout.html' &&
            currRoute.depth <= route.depth) ||
          currRoute.path === route.path
      )
      .sort((a, b) => a.depth - b.depth)
      .map(async ({ path }) => {
        const $ = load(readFileSync(path));
        const scriptText = $('script[server]').html();
        const functionText = `
          return (async function(params, body, query, redirect) {
            ${scriptText}
          })(params, body, query, redirect)
        `;
        const script = new Function(
          'params',
          'body',
          'query',
          'redirect',
          functionText
        );
        $('script[server]').replaceWith('');
        const { html, partials: localPartials } = extractPartials($.html());
        localPartials.forEach(({ id, html }) => (partials[id] = html));
        const exe = await script(req.params, req.body, req.query, res.redirect);
        return mustache.render(
          html.replace('{{&gt;', '{{>'), // fix cheerio converting template
          exe,
          partials
        );
      })
  );
  return files.reduce((stacked, layout) => {
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
}
