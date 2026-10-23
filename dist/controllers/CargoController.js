"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoController = void 0;
const BaseController_1 = require("./BaseController");
const StandardResponse_1 = require("../http/StandardResponse");
const Cargo_1 = require("../models/Cargo");
class CargoController extends BaseController_1.BaseController {
    _cargoService;
    constructor(cargoServiceDependency) {
        super();
        console.log("⬆️  CargoController.constructor()");
        this._cargoService = cargoServiceDependency;
    }
    create = async (request, response) => {
        console.log("🔵 CargoController.create()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const novoCargo = new Cargo_1.Cargo();
        novoCargo.nomeCargo = request.body.cargo.nomeCargo;
        const resultado = await this._cargoService.create(novoCargo, funcionarioLogado);
        if (!resultado) {
            StandardResponse_1.StandardResponse.error("Falha ao cadastrar novo Cargo", null, 500).send(response);
            return;
        }
        StandardResponse_1.StandardResponse.created("Cadastro realizado com sucesso", {
            cargos: [{
                    idCargo: novoCargo.idCargo,
                    nomeCargo: novoCargo.nomeCargo
                }]
        }).send(response);
    };
    findAll = async (request, response) => {
        console.log("🔵 CargoController.findAll()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const arrayCargos = await this._cargoService.findAll(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Busca realizada com sucesso", {
            cargos: arrayCargos
        }).send(response);
    };
    findById = async (request, response) => {
        console.log("🔵 CargoController.findById()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const cargo = await this._cargoService.findById(cargoId, funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Executado com sucesso", {
            cargos: cargo
        }).send(response);
    };
    update = async (request, response) => {
        console.log("🔵 CargoController.update()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const nomeCargo = request.body.cargo.nomeCargo;
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = cargoId;
        cargo.nomeCargo = nomeCargo;
        const atualizou = await this._cargoService.update(cargo, funcionarioLogado);
        if (atualizou) {
            StandardResponse_1.StandardResponse.success("Atualizado com sucesso", {
                cargos: [{
                        idCargo: cargoId,
                        nomeCargo: nomeCargo
                    }]
            }).send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Cargo não encontrado para atualização", {
                cargos: [{
                        idCargo: cargoId,
                        nomeCargo: nomeCargo
                    }]
            }).send(response);
        }
    };
    delete = async (request, response) => {
        console.log("🔵 CargoController.delete()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = request.params.idCargo.toString();
        const excluiu = await this._cargoService.delete(cargo, funcionarioLogado);
        if (excluiu) {
            StandardResponse_1.StandardResponse.noContent().send(response);
        }
        else {
            StandardResponse_1.StandardResponse.notFound("Cargo não encontrado para exclusão", {
                cargos: [{
                        idCargo: cargo.idCargo
                    }]
            }).send(response);
        }
    };
    count = async (request, response) => {
        console.log("🔵 CargoController.count()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const total = await this._cargoService.count(funcionarioLogado);
        StandardResponse_1.StandardResponse.success("Total de cargos obtido", { total }).send(response);
    };
}
exports.CargoController = CargoController;
//# sourceMappingURL=CargoController.js.map