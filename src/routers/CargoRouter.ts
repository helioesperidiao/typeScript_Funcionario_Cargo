import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { PermissaoAdminMiddleware } from "../middlewares/PermissaoAdminMiddleware";
import { CargoController } from "../controllers/CargoController";
import { CargoService } from "../services/CargoService";
import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoRouter");

/** Registra os endpoints de cargos e os middlewares que protegem cada operação. */
export class CargoRouter {
    public static readonly PREFIX = "/api/cargos";

    private _router: Router;

    /** Conecta as camadas da funcionalidade e associa controllers aos endpoints. */
    constructor() {
        log.debug("constructor()");

        const mainRouter = Router();
        const subRouter = Router();

        const mongoDB = new MongoDatabase();
        const cargoDAO = new CargoDAO(mongoDB);
        const funcionarioDAO = new FuncionarioDAO(mongoDB);

        const cargoService = new CargoService(cargoDAO, funcionarioDAO);
        const cargoController = new CargoController(cargoService);
        const jwtMiddleware = new JwtMiddleware();
        const permissaoAdmin = new PermissaoAdminMiddleware();

        // A ordem importa: primeiro autenticamos, depois verificamos o perfil admin.
        // Rotas de escrita — exigem Administrador
        subRouter.post(
            "/",
            jwtMiddleware.validateToken,
            permissaoAdmin.verificarPermissaoAdmin,
            asyncHandler(cargoController.create)
        );
        subRouter.put(
            "/:idCargo",
            jwtMiddleware.validateToken,
            permissaoAdmin.verificarPermissaoAdmin,
            asyncHandler(cargoController.update)
        );
        subRouter.delete(
            "/:idCargo",
            jwtMiddleware.validateToken,
            permissaoAdmin.verificarPermissaoAdmin,
            asyncHandler(cargoController.delete)
        );

        // Rotas de leitura — qualquer usuário logado
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(cargoController.findAll));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(cargoController.count));
        subRouter.get("/:idCargo", jwtMiddleware.validateToken, asyncHandler(cargoController.findById));

        mainRouter.use(CargoRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    /** Fornece o roteador Express para que o servidor o registre. */
    public getRouter = (): Router => {
        return this._router;
    };
}