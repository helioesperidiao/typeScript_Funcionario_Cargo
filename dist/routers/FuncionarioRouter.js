"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioRouter = void 0;
const express_1 = require("express");
const JwtMiddleware_1 = require("../middlewares/JwtMiddleware");
const FuncionarioController_1 = require("../controllers/FuncionarioController");
const FuncionarioService_1 = require("../services/FuncionarioService");
const FuncionarioDAO_1 = require("../dao/FuncionarioDAO");
const CargoDAO_1 = require("../dao/CargoDAO");
const MongoDatabase_1 = require("../database/MongoDatabase");
class FuncionarioRouter {
    static PREFIX = "/api/v1/funcionarios";
    _router;
    constructor() {
        console.log("⬆️ FuncionarioRouter.constructor()");
        const mainRouter = (0, express_1.Router)();
        const subRouter = (0, express_1.Router)();
        const mongoDB = new MongoDatabase_1.MongoDatabase();
        const funcionarioDAO = new FuncionarioDAO_1.FuncionarioDAO(mongoDB);
        const cargoDAO = new CargoDAO_1.CargoDAO(mongoDB);
        const funcionarioService = new FuncionarioService_1.FuncionarioService(funcionarioDAO, cargoDAO);
        const funcionarioController = new FuncionarioController_1.FuncionarioController(funcionarioService);
        const jwtMiddleware = new JwtMiddleware_1.JwtMiddleware();
        subRouter.post("/login", funcionarioController.login);
        subRouter.post("/", jwtMiddleware.validateToken, funcionarioController.create);
        subRouter.get("/", jwtMiddleware.validateToken, funcionarioController.findAll);
        subRouter.get("/count", jwtMiddleware.validateToken, funcionarioController.count);
        subRouter.get("/count/:idCargo", jwtMiddleware.validateToken, funcionarioController.countByCargoId);
        subRouter.get("/:idFuncionario", jwtMiddleware.validateToken, funcionarioController.findById);
        subRouter.put("/:idFuncionario", jwtMiddleware.validateToken, funcionarioController.update);
        subRouter.delete("/:idFuncionario", jwtMiddleware.validateToken, funcionarioController.delete);
        mainRouter.use(FuncionarioRouter.PREFIX, subRouter);
        this._router = mainRouter;
    }
    getRouter = () => {
        return this._router;
    };
}
exports.FuncionarioRouter = FuncionarioRouter;
//# sourceMappingURL=FuncionarioRouter.js.map