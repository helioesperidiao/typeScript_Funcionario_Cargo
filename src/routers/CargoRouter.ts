import { Router } from "express";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import { CargoController } from "../controllers/CargoController";
import { CargoService } from "../services/CargoService";
import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { MongoDatabase } from "../database/MongoDatabase";
import { asyncHandler } from "../http/asyncHandler";
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoRouter");

export class CargoRouter {
    public static readonly PREFIX = "/api/v1/cargos";

    private _router: Router;

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

        subRouter.post("/", jwtMiddleware.validateToken, asyncHandler(cargoController.create));
        subRouter.get("/", jwtMiddleware.validateToken, asyncHandler(cargoController.findAll));
        subRouter.get("/count", jwtMiddleware.validateToken, asyncHandler(cargoController.count));
        subRouter.get("/:idCargo", jwtMiddleware.validateToken, asyncHandler(cargoController.findById));
        subRouter.put("/:idCargo", jwtMiddleware.validateToken, asyncHandler(cargoController.update));
        subRouter.delete("/:idCargo", jwtMiddleware.validateToken, asyncHandler(cargoController.delete));

        mainRouter.use(CargoRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }

    public getRouter = (): Router => {
        return this._router;
    };
}