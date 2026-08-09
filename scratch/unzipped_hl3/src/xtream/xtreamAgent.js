"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpAgent = exports.httpsAgent = void 0;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
exports.httpsAgent = new https_1.default.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 100,
    maxFreeSockets: 20,
    rejectUnauthorized: false,
    timeout: 0
});
exports.httpAgent = new http_1.default.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 100,
    maxFreeSockets: 20,
    timeout: 0
});
