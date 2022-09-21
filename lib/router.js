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
const re = /(?:\.([^.]+))?$/;
function getFiles(baseRoute, dir) {
    const dirents = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
    const reMethod = /\.(.+)\.js$/;
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
            return extension === 'js'
                ? {
                    path: res,
                    route: res
                        .replace(baseRoute, '')
                        .replace('.js', '')
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
exports.getFiles = getFiles;
function closestErrorFile(routes, depth) {
    return routes
        .filter((route) => route.name === '_error.js' && route.depth <= depth)
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
function processPath(req, routes, route, doLayout) {
    return __awaiter(this, void 0, void 0, function* () {
        const partials = {};
        const files = yield Promise.all(routes
            .filter((currRoute) => (doLayout &&
            currRoute.name === '_layout.js' &&
            currRoute.depth <= route.depth) ||
            currRoute.path === route.path)
            .sort((a, b) => a.depth - b.depth)
            .map(({ path }) => __awaiter(this, void 0, void 0, function* () {
            const { script = () => ({}), template = '' } = require(path);
            const { html, partials: localPartials } = extractPartials(template);
            localPartials.forEach(({ id, html }) => (partials[id] = html));
            const exe = script.constructor.name === 'AsyncFunction'
                ? yield script(req)
                : script(req);
            return mustache_1.default.render(html.replace('{{&gt;', '{{>'), // fix cheerio converting template
            exe, partials);
        })));
        return files.reduce((stacked, layout) => {
            if (stacked) {
                const $stack = (0, cheerio_1.load)(stacked);
                $stack('slot').replaceWith(layout);
                return $stack.html();
            }
            else {
                return layout;
            }
        }, '');
    });
}
exports.processPath = processPath;
