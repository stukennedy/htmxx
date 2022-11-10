"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirect = exports.Htmxx = void 0;
var path_1 = require("path");
var fs_1 = require("fs");
var interfaces_1 = require("./interfaces");
var utils = __importStar(require("./utils"));
var server_1 = __importDefault(require("./server"));
var LAYOUT = '_layout.ts';
var Htmxx = /** @class */ (function () {
    function Htmxx(dir) {
        this.dir = dir;
        this.files = this.parseFiles(dir + '/routes');
        console.log(this.getRoutes());
    }
    Htmxx.prototype.getRoutes = function () {
        return this.files
            .filter(function (file) { return !utils.isHidden(file.name); })
            .map(function (file) { return file.route; });
    };
    Htmxx.prototype.getErrorFile = function (depth) {
        return __awaiter(this, void 0, void 0, function () {
            var errorFile;
            return __generator(this, function (_a) {
                errorFile = utils.closestErrorFile(this.files, depth);
                return [2 /*return*/, (errorFile === null || errorFile === void 0 ? void 0 : errorFile.route) || '/error'];
            });
        });
    };
    Htmxx.prototype.parseFiles = function (baseRoute, currentDir) {
        var _a;
        var _this = this;
        var dir = currentDir !== null && currentDir !== void 0 ? currentDir : baseRoute;
        var dirents = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
        var reMethod = /\.(.+)\.ts$/;
        var reExt = /(?:\.([^.]+))?$/;
        var files = dirents
            .map(function (dirent) {
            var _a, _b, _c;
            var path = (0, path_1.resolve)(dir, dirent.name);
            var depth = (path.match(/\//g) || []).length -
                (baseRoute.match(/\//g) || []).length;
            var extension = (_a = reExt.exec(dirent.name)) === null || _a === void 0 ? void 0 : _a[1];
            var hidden = ((_b = dirent.name) === null || _b === void 0 ? void 0 : _b[0]) === '_';
            var method = ((_c = reMethod.exec(dirent.name)) === null || _c === void 0 ? void 0 : _c[1].toUpperCase()) || 'GET';
            if (dirent.isDirectory()) {
                return _this.parseFiles(baseRoute, path);
            }
            else {
                var route = utils.getRoute(path, baseRoute);
                var routeRe = utils.buildRouteRegex(route);
                return extension === 'ts'
                    ? {
                        path: path,
                        route: route,
                        routeRe: routeRe,
                        name: dirent.name,
                        hidden: hidden,
                        depth: depth,
                        method: method,
                    }
                    : undefined;
            }
        })
            .filter(function (route) { return route; });
        return (_a = Array.prototype).concat.apply(_a, files);
    };
    Htmxx.prototype.processPath = function (req, file) {
        return __awaiter(this, void 0, void 0, function () {
            var stacks, route, fn, markup, _i, stacks_1, stack;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stacks = this.files
                            .filter(function (route) { return route.name === LAYOUT && route.depth <= file.depth; })
                            .sort(function (a, b) { return b.depth - a.depth; });
                        route = this.files.find(function (route) { return route.path === file.path; });
                        if (!route) {
                            throw new interfaces_1.RedirectError(303, '/error');
                        }
                        fn = require(route.path).default;
                        return [4 /*yield*/, fn(req, '')];
                    case 1:
                        markup = _a.sent();
                        _i = 0, stacks_1 = stacks;
                        _a.label = 2;
                    case 2:
                        if (!(_i < stacks_1.length)) return [3 /*break*/, 5];
                        stack = stacks_1[_i];
                        console.log({ stack: stack });
                        fn = require(stack.path).default;
                        return [4 /*yield*/, fn(req, markup)];
                    case 3:
                        markup = _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, markup];
                }
            });
        });
    };
    Htmxx.prototype.processRoute = function (route, method, req) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedRoute, file, errorRoute, output, error_1, redirection, errorRoute;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trimmedRoute = route.replace(/\/$/, '');
                        file = this.files.find(function (file) { return file.routeRe.exec(trimmedRoute) && file.method === method; });
                        if (!(!file || file.hidden)) return [3 /*break*/, 2];
                        if (trimmedRoute === '/error') {
                            return [2 /*return*/, '<h3>{{error}}</h3>'];
                        }
                        return [4 /*yield*/, this.getErrorFile(0)];
                    case 1:
                        errorRoute = _a.sent();
                        throw new interfaces_1.RedirectError(303, errorRoute);
                    case 2:
                        output = '';
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 7]);
                        req.params = utils.getParams(trimmedRoute, file);
                        return [4 /*yield*/, this.processPath(req, file)];
                    case 4:
                        output = _a.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        error_1 = _a.sent();
                        console.error(error_1);
                        // eslint-disable-next-line no-prototype-builtins
                        if (error_1 === null || error_1 === void 0 ? void 0 : error_1.hasOwnProperty('location')) {
                            redirection = error_1;
                            throw redirection;
                        }
                        return [4 /*yield*/, this.getErrorFile(file.depth)];
                    case 6:
                        errorRoute = _a.sent();
                        throw new interfaces_1.RedirectError(303, errorRoute);
                    case 7: return [2 /*return*/, output];
                }
            });
        });
    };
    Htmxx.prototype.startServer = function () {
        (0, server_1.default)(this);
    };
    return Htmxx;
}());
exports.Htmxx = Htmxx;
var redirect = function (status, location) {
    throw new interfaces_1.RedirectError(status, location);
};
exports.redirect = redirect;
