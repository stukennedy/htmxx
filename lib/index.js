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
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const router_1 = require("./router");
dotenv_1.default.config();
const PORT = Number(process.env.PORT || 3000);
const app = (0, express_1.default)();
const appWs = (0, express_ws_1.default)(app);
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.use(express_1.default.static(process.cwd() + '/assets'));
app.use((0, compression_1.default)());
const getAppMethod = (method, route, callback) => {
    const paramRoute = route.replace(/\[(.+)\]/g, ':$1');
    switch (method) {
        case 'DELETE':
            return app.delete(paramRoute, callback);
        case 'PUT':
            return app.put(paramRoute, callback);
        case 'POST':
            return app.post(paramRoute, callback);
        case 'PATCH':
            return app.patch(paramRoute, callback);
        default:
            return app.get(paramRoute, callback);
    }
};
const htmxx = (routesDir) => __awaiter(void 0, void 0, void 0, function* () {
    const baseRoute = process.cwd() + routesDir;
    const routes = (0, router_1.getFiles)(baseRoute, baseRoute);
    if (!routes || !routes.length) {
        throw new Error(`no valid routes found for path: ${baseRoute}`);
    }
    routes.forEach((f) => {
        if (f.hidden)
            return;
        if (f.method === 'WS') {
            app.ws(f.route, (ws, req) => {
                ws.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
                    req.body = JSON.parse(msg || '{}');
                    const { markup } = yield (0, router_1.processPath)(req, routes, f, false);
                    appWs.getWss().clients.forEach((client) => {
                        if (client.OPEN) {
                            client.send(markup);
                        }
                    });
                }));
            });
            return;
        }
        getAppMethod(f.method, f.route, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { ws, markup } = yield (0, router_1.processPath)(req, routes, f, f.method === 'GET');
                if (ws !== undefined) {
                    appWs.getWss().clients.forEach((client) => {
                        if (client.OPEN) {
                            client.send(markup);
                        }
                    });
                }
                res.send(markup);
            }
            catch (error) {
                // eslint-disable-next-line no-prototype-builtins
                if (error === null || error === void 0 ? void 0 : error.hasOwnProperty('location')) {
                    const { location, status } = error;
                    res.redirect(status, location);
                    return;
                }
                console.error(error);
                const errorRoute = (0, router_1.closestErrorFile)(routes, f.depth);
                if (errorRoute) {
                    const { markup } = yield (0, router_1.processPath)(req, routes, errorRoute, false);
                    res.send(markup);
                }
                else {
                    res.send(`<div>${error}</div>`);
                }
            }
        }));
    });
    return new Promise((resolve) => {
        app.listen(PORT, () => {
            console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
            resolve(app);
        });
    });
});
module.exports = htmxx;
