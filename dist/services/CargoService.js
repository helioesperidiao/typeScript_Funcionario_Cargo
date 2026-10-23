"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoService = void 0;
const Cargo_1 = require("../models/Cargo");
const ErrorResponse_1 = require("../http/ErrorResponse");
class CargoService {
    _cargoDAO;
    constructor(cargoDAODependency) {
        console.log("⬆️  CargoService.constructor()");
        this._cargoDAO = cargoDAODependency;
    }
    create = async (cargo, funcionarioLogado) => {
        console.log("🟣 CargoService.createCargo()");
        if (funcionarioLogado.cargo.nomeCargo !== "Administrador") {
            throw new ErrorResponse_1.ErrorResponse(403, "Não autorizado", { message: `O cargo "${funcionarioLogado.cargo.nomeCargo}" não é autorizado a criar cargos.` });
        }
        const resultado = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        if (resultado.length > 0) {
            throw new ErrorResponse_1.ErrorResponse(400, "Cargo já existe", { message: `O cargo "${cargo.nomeCargo}" já existe.` });
        }
        return await this._cargoDAO.create(cargo);
    };
    findAll = async (_funcionarioLogado) => {
        console.log("🟣 CargoService.findAll()");
        return await this._cargoDAO.findAll();
    };
    findById = async (idCargo, _funcionarioLogado) => {
        console.log("🟣 CargoService.findById()");
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = idCargo;
        return await this._cargoDAO.findById(cargo.idCargo);
    };
    update = async (cargo, _funcionarioLogado) => {
        console.log("🟣 CargoService.updateCargo()");
        return await this._cargoDAO.update(cargo);
    };
    delete = async (cargo, _funcionarioLogado) => {
        console.log("🟣 CargoService.delete()");
        return await this._cargoDAO.delete(cargo);
    };
    count = async (_funcionarioLogado) => {
        console.log("🟣 CargoService.countCargos()");
        return await this._cargoDAO.count();
    };
}
exports.CargoService = CargoService;
//# sourceMappingURL=CargoService.js.map