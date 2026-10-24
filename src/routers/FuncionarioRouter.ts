import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { PermissaoAdminMiddleware } from "../middlewares/PermissaoAdminMiddleware";
import { FuncionarioController } from "../controllers/FuncionarioController";
import { FuncionarioService } from "../services/FuncionarioService";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { CargoDAO } from "../dao/CargoDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioRouter");

/** Registra os endpoints de funcionários e aplica autenticação e autorização. */
export class FuncionarioRouter {
    public static readonly PREFIX = "/api/funcionarios";

    private _router: Router;
    private _funcionarioService: FuncionarioService;

    /** Prepara a cadeia DAO → serviço → controller e registra suas rotas HTTP. */
    constructor() {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const mongoDB = new MongoDatabase();
        const funcionarioDAO = new FuncionarioDAO(mongoDB);
        const cargoDAO = new CargoDAO(mongoDB);
        this._funcionarioService = new FuncionarioService(funcionarioDAO, cargoDAO);
        const funcionarioController = new FuncionarioController(this._funcionarioService);
        const jwtMiddleware = new JwtMiddleware();
        const permissaoAdmin = new PermissaoAdminMiddleware();

        // Login é público
        subRouter.post("/login", asyncHandler(funcionarioController.login));

        // A ordem importa: valida-se a identidade antes de checar a permissão.
        // Escrita — exige Administrador
        subRouter.post(
            "/",
            jwtMiddleware.validateToken,
            permissaoAdmin.verificarPermissaoAdmin,
            asyncHandler(funcionarioController.create)
        );
        subRouter.put(
            "/:idFuncionario",
            jwtMiddleware.validateToken,
            permissaoAdmin.verificarPermissaoAdmin,
            asyncHandler(funcionarioController.update)
        );
        subRouter.delete(
            "/:idFuncionario",
            jwtMiddleware.validateToken,
            permissaoAdmin.verificarPermissaoAdmin,
            asyncHandler(funcionarioController.delete)
        );

        // Leitura — qualquer usuário logado
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(funcionarioController.findAll));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(funcionarioController.count));
        subRouter.get("/count/:idCargo", jwtMiddleware.validateToken, asyncHandler(funcionarioController.countByCargoId));
        subRouter.get("/:idFuncionario", jwtMiddleware.validateToken, asyncHandler(funcionarioController.findById));

        mainRouter.use(FuncionarioRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    /** Fornece o roteador Express para registro no servidor. */
    public getRouter = (): Router => {
        return this._router;
    };

    /** Expõe o serviço para tarefas de inicialização, como criar o admin padrão. */
    public getService = (): FuncionarioService => {
        return this._funcionarioService;
    };
}