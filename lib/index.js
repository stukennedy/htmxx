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
var express = require('express');
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const router_1 = require("./router");
dotenv_1.default.config();
const getAppMethod = (app, method, route, callback) => {
    switch (method) {
        case 'DELETE':
            return app.delete(route, callback);
        case 'UPDATE':
            return app.set(route, callback);
        case 'PUT':
            return app.put(route, callback);
        case 'POST':
            return app.post(route, callback);
        default:
            return app.get(route, callback);
    }
};
exports.default = (routesDir) => __awaiter(void 0, void 0, void 0, function* () {
    const app = express();
    const expressWs = require('express-ws')(app);
    const PORT = process.env.PORT || 3000;
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.set('view engine', 'html');
    app.use(express.static(process.cwd() + '/assets'));
    app.use((0, compression_1.default)());
    const baseRoute = process.cwd() + (routesDir || '/routes');
    const routes = (0, router_1.getFiles)(baseRoute, baseRoute);
    if (!routes || !routes.length) {
        throw new Error(`no valid routes found for path: ${baseRoute}`);
    }
    routes.map((f) => {
        if (!f.hidden) {
            getAppMethod(app, f.method, f.route, (req, res) => {
                let output = '';
                try {
                    output = (0, router_1.processFile)(req, routes, f, f.method === 'GET');
                }
                catch (error) {
                    console.error(error);
                    const errorRoute = (0, router_1.closestErrorFile)(routes, f.depth);
                    if (errorRoute) {
                        output = (0, router_1.processFile)(req, routes, errorRoute, false);
                    }
                    else {
                        output = `<div>ERROR: ${error}</div<`;
                    }
                }
                finally {
                    res.send(output);
                }
            });
        }
    });
    app.listen(PORT, () => {
        console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
        return app;
    });
});
