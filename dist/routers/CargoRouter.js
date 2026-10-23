"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const CargoController_1 = require("../controllers/CargoController");
const CargoService_1 = require("../services/CargoService");
const CargoDAO_1 = require("../dao/CargoDAO");
const MongoDatabase_1 = require("../database/MongoDatabase");
class CargoRouter {
    static PREFIX = "/api/v1/cargos";
    _router;
    constructor() {
        console.log("⬆️ CargoRouter.constructor()");
        const mainRouter = (0, express_1.Router)();
        const subRouter = (0, express_1.Router)();
        const mongoDB = new MongoDatabase_1.MongoDatabase();
        const cargoDAO = new CargoDAO_1.CargoDAO(mongoDB);
        const cargoService = new CargoService_1.CargoService(cargoDAO);
        const cargoController = new CargoController_1.CargoController(cargoService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        subRouter.post("/", jwtMiddleware.validateToken, cargoController.create);
        subRouter.get("/", jwtMiddleware.validateToken, cargoController.findAll);
        subRouter.get("/count", jwtMiddleware.validateToken, cargoController.count);
        subRouter.get("/:idCargo", jwtMiddleware.validateToken, cargoController.findById);
        subRouter.put("/:idCargo", jwtMiddleware.validateToken, cargoController.update);
        subRouter.delete("/:idCargo", jwtMiddleware.validateToken, cargoController.delete);
        mainRouter.use(CargoRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }
    getRouter = () => {
        return this._router;
    };
}
exports.CargoRouter = CargoRouter;
//# sourceMappingURL=CargoRouter.js.map