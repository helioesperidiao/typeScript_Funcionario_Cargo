"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const CargoRouter_1 = require("./routers/CargoRouter");
const FuncionarioRouter_1 = require("./routers/FuncionarioRouter");
const ErrorResponse_1 = require("./http/ErrorResponse");
const StandardResponse_1 = require("./http/StandardResponse");
class Server {
    _porta;
    _app;
    _cargoRouter;
    _funcionarioRouter;
    constructor(porta) {
        console.log("⬆️ Server.constructor()");
        this._porta = porta;
        this._app = (0, express_1.default)();
        this._cargoRouter = new CargoRouter_1.CargoRouter();
        this._funcionarioRouter = new FuncionarioRouter_1.FuncionarioRouter();
    }
    async init() {
        console.log("⬆️ Server.init()");
        this._app.use((0, cors_1.default)({ origin: "*" }));
        this._app.use(express_1.default.json());
        this._app.use(express_1.default.static(path_1.default.resolve(__dirname, "public")));
        this._app.use(this._cargoRouter.getRouter());
        this._app.use(this._funcionarioRouter.getRouter());
        this.setupErrorMiddleware();
    }
    setupErrorMiddleware() {
        this._app.use((error, _req, res, _next) => {
            console.error("❌ Erro capturado:", error);
            if (error instanceof ErrorResponse_1.ErrorResponse) {
                return StandardResponse_1.StandardResponse.error(error.message, error.error, error.httpCode).send(res);
            }
            return StandardResponse_1.StandardResponse.internalError("Erro interno do servidor", {
                message: error.message || "Erro interno"
            }).send(res);
        });
    }
    run() {
        this._app.listen(this._porta)
            .on('error', (err) => {
            console.error(`❌ Erro ao iniciar servidor na porta ${this._porta}:`, err);
            process.exit(1);
        })
            .on('listening', () => {
            console.log(`🚀 Server rodando em http://localhost:${this._porta}/faltas/Login.html`);
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map