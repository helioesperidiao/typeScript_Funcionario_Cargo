import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

import { CargoRouter } from "./routers/CargoRouter";
import { FuncionarioRouter } from "./routers/FuncionarioRouter";
import { ErrorResponse } from "./http/ErrorResponse";
import { StandardResponse } from "./http/StandardResponse";
import { httpLogger } from "./logging/HttpLogger";
import { createLogger } from "./logging/Logger";

const log = createLogger("Server");

export class Server {
    private _porta: number;
    private _app: Express;
    private _cargoRouter: CargoRouter;
    private _funcionarioRouter: FuncionarioRouter;

    constructor(porta: number) {
        log.debug("constructor()");
        this._porta = porta;
        this._app = express();
        this._cargoRouter = new CargoRouter();
        this._funcionarioRouter = new FuncionarioRouter();
    }

    async init(): Promise<void> {
        log.debug("init()");

        try {
            await this._funcionarioRouter.getService().initializeDefaultAdmin();
        } catch (err) {
            log.error("falha ao inicializar administrador padrão", { error: err });
        }

        this._app.use(httpLogger);
        this._app.use(cors({ origin: "*" }));
        this._app.use(express.json());

        const publicDir = path.resolve(__dirname, "public");
        this._app.use(express.static(publicDir));

        this._app.use(this._cargoRouter.getRouter());
        this._app.use(this._funcionarioRouter.getRouter());

        this._app.use((_req: Request, res: Response) => {
            StandardResponse.notFound("Rota não encontrada").send(res);
        });

        this.setupErrorMiddleware();
    }

    private setupErrorMiddleware(): void {
        this._app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
            if (error instanceof ErrorResponse) {
                log.warn("erro de negócio", {
                    httpCode: error.httpCode,
                    message: error.message,
                    details: error.error,
                });
                return StandardResponse.error(error.message, error.error, error.httpCode).send(res);
            }

            log.error("erro não tratado", {
                message: error?.message,
                stack: error?.stack,
            });

            return StandardResponse.internalError("Erro interno do servidor", {
                message: error?.message || "Erro interno",
            }).send(res);
        });
    }

    run(): void {
        this._app
            .listen(this._porta)
            .on("error", (err) => {
                log.error(`falha ao escutar na porta ${this._porta}`, { error: err });
                process.exit(1);
            })
            .on("listening", () => {
                log.info(`servidor ouvindo em http://localhost:${this._porta}`);
            });
    }
}