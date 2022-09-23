"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPath = exports.closestErrorFile = exports.getFiles = void 0;
const path_1 = require("path");
const mustache_1 = __importDefault(require("mustache"));
const fs_1 = require("fs");
const cheerio_1 = require("cheerio");
const path_2 = __importDefault(require("path"));
const re = /(?:\.([^.]+))?$/;
class RedirectError {
    constructor(status, location) {
        this.status = status;
        this.location = location;
    }
}
function getFiles(baseRoute, dir) {
    const dirents = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
    const reMethod = /\.(.+)\.html$/;
    const files = dirents
        .map((dirent) => {
        var _a, _b, _c;
        const res = (0, path_1.resolve)(dir, dirent.name);
        const depth = (res.match(/\//g) || []).length - (baseRoute.match(/\//g) || []).length;
        const extension = (_a = re.exec(dirent.name)) === null || _a === void 0 ? void 0 : _a[1];
        const hidden = ((_b = dirent.name) === null || _b === void 0 ? void 0 : _b[0]) === '_';
        const method = ((_c = reMethod.exec(dirent.name)) === null || _c === void 0 ? void 0 : _c[1].toUpperCase()) || 'GET';
        if (dirent.isDirectory()) {
            return getFiles(baseRoute, res);
        }
        else {
            return extension === 'html'
                ? {
                    path: res,
                    route: res
                        .replace(baseRoute, '')
                        .replace('.html', '')
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
        .filter((route) => route);
    return Array.prototype.concat(...files);
}
exports.getFiles = getFiles;
function closestErrorFile(routes, depth) {
    return routes
        .filter((route) => route.name === '_error.html' && route.depth <= depth)
        .sort((a, b) => b.depth - a.depth)
        .at(0);
}
exports.closestErrorFile = closestErrorFile;
function extractPartials(content) {
    const $ = (0, cheerio_1.load)(content);
    const partials = [];
    $('script[type="text/html"]').each(function (_, el) {
        const id = $(this).attr('id');
        const html = $(this).html();
        if (id && html) {
            partials.push({ id, html });
        }
    });
    $('script[type="text/html"]').replaceWith('');
    return { html: $.html(), partials };
}
const convertRequires = (script, filePath) => {
    const requireRe = /require\('(\..+)'\)/g;
    const currentDir = path_2.default.join(filePath, '..');
    const rootDir = filePath.substring(0, filePath.indexOf('/routes'));
    return script
        .replace(/require\('~\/(.+)'\)/g, `require('${rootDir}/$1')`)
        .replace(requireRe, `require('${currentDir}/$1')`);
};
function processPath(req, routes, route, doLayout) {
    return __awaiter(this, void 0, void 0, function* () {
        const partials = {};
        const files = yield Promise.all(routes
            .filter((currRoute) => (currRoute.name === '_layout.html' &&
            currRoute.depth <= route.depth) ||
            currRoute.path === route.path)
            .sort((a, b) => a.depth - b.depth)
            .map(({ name, path }) => __awaiter(this, void 0, void 0, function* () {
            const $ = (0, cheerio_1.load)((0, fs_1.readFileSync)(path));
            const scriptText = $('script[server]').html() || '';
            const functionText = `
          return (async function(params, body, query, require, redirect) {
            ${convertRequires(scriptText, path)}
          })(params, body, query, require, redirect)
        `;
            const script = new Function('params', 'body', 'query', 'require', 'redirect', functionText);
            $('script[server]').replaceWith('');
            const { html, partials: localPartials } = extractPartials($.html());
            localPartials.forEach(({ id, html }) => (partials[id] = html));
            const exe = yield script(req.params, req.body, req.query, require, (status, location) => {
                throw new RedirectError(status, location);
            });
            if (!doLayout && name === '_layout.html') {
                return '<slot></slot>';
            }
            else {
                return mustache_1.default.render(html.replace(/\{\{&gt;/g, '{{>'), // fix cheerio converting template
                exe, partials);
            }
        })));
        return files.reduce((stacked, layout) => {
            if (stacked) {
                const $stack = (0, cheerio_1.load)(stacked);
                if (layout) {
                    $stack('slot').replaceWith(layout);
                }
                return $stack.html();
            }
            else {
                return layout;
            }
        }, '');
    });
}
exports.processPath = processPath;
