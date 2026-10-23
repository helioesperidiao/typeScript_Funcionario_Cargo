import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { FuncionarioController } from "../controllers/FuncionarioController";
import { FuncionarioService } from "../services/FuncionarioService";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { CargoDAO } from "../dao/CargoDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioRouter");

export class FuncionarioRouter {
    public static readonly PREFIX = "/api/v1/funcionarios";

    private _router: Router;
    private _funcionarioService: FuncionarioService;

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

        subRouter.post("/login", asyncHandler(funcionarioController.login));

        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(funcionarioController.create));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(funcionarioController.findAll));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(funcionarioController.count));
        subRouter.get("/count/:idCargo", jwtMiddleware.validateToken, asyncHandler(funcionarioController.countByCargoId));
        subRouter.get("/:idFuncionario", jwtMiddleware.validateToken, asyncHandler(funcionarioController.findById));
        subRouter.put("/:idFuncionario", jwtMiddleware.validateToken, asyncHandler(funcionarioController.update));
        subRouter.delete("/:idFuncionario", jwtMiddleware.validateToken, asyncHandler(funcionarioController.delete));

        mainRouter.use(FuncionarioRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => {
        return this._router;
    };

    public getService = (): FuncionarioService => {
        return this._funcionarioService;
    };
}