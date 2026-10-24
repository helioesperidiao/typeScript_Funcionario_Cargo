import { Request, Response } from "express";
import { CargoService } from "../services/CargoService";
import { BaseController } from "./BaseController";
import { StandardResponse } from "../http/StandardResponse";
import { Cargo } from "../models/Cargo";
import { Funcionario } from "../models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoController");

/** Traduz requisições HTTP de cargos em chamadas aos serviços de negócio. */
export class CargoController extends BaseController {
    private _cargoService: CargoService;

    /** Recebe o serviço responsável pelas regras de negócio de cargos. */
    constructor(cargoServiceDependency: CargoService) {
        super();
        this._cargoService = cargoServiceDependency;
    }

    /** Recebe os dados de um cargo novo e devolve a resposta de criação. */
    public create = async (request: Request, response: Response): Promise<void> => {
        log.debug("create()");

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const dados = this.requireBody(request, "cargo");

        if (!dados.nomeCargo) {
            throw new ErrorResponse(400, "nomeCargo é obrigatório");
        }

        const novoCargo = new Cargo();
        novoCargo.nomeCargo = dados.nomeCargo;

        const resultado = await this._cargoService.create(novoCargo, funcionarioLogado);

        if (!resultado) {
            log.error("falha ao cadastrar cargo", { nomeCargo: novoCargo.nomeCargo });
            StandardResponse.error("Falha ao cadastrar novo Cargo", null, 500).send(response);
            return;
        }

        StandardResponse.created("Cadastro realizado com sucesso", {
            cargos: [{
                idCargo: novoCargo.idCargo,
                nomeCargo: novoCargo.nomeCargo
            }]
        }).send(response);
    };

    /** Lista os cargos disponíveis para o funcionário autenticado. */
    public findAll = async (request: Request, response: Response): Promise<void> => {
        log.debug("findAll()");
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const arrayCargos = await this._cargoService.findAll(funcionarioLogado);
        StandardResponse.success("Busca realizada com sucesso", { cargos: arrayCargos }).send(response);
    };

    /** Procura um cargo pelo identificador informado na URL. */
    public findById = async (request: Request, response: Response): Promise<void> => {
        log.debug("findById()", { idCargo: request.params.idCargo });
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const cargo = await this._cargoService.findById(cargoId, funcionarioLogado);

        if (!cargo) {
            StandardResponse.notFound("Cargo não encontrado", { cargos: null }).send(response);
            return;
        }

        StandardResponse.success("Executado com sucesso", { cargos: cargo }).send(response);
    };

    /** Atualiza o nome de um cargo existente. */
    public update = async (request: Request, response: Response): Promise<void> => {
        log.debug("update()", { idCargo: request.params.idCargo });

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const dados = this.requireBody(request, "cargo");

        const cargo = new Cargo();
        cargo.idCargo = cargoId;
        cargo.nomeCargo = dados.nomeCargo;

        const atualizou = await this._cargoService.update(cargo, funcionarioLogado);

        if (atualizou) {
            StandardResponse.success("Atualizado com sucesso", {
                cargos: [{ idCargo: cargoId, nomeCargo: dados.nomeCargo }]
            }).send(response);
        } else {
            StandardResponse.notFound("Cargo não encontrado para atualização", {
                cargos: [{ idCargo: cargoId, nomeCargo: dados.nomeCargo }]
            }).send(response);
        }
    };

    /** Exclui um cargo, se as regras de negócio permitirem. */
    public delete = async (request: Request, response: Response): Promise<void> => {
        log.debug("delete()", { idCargo: request.params.idCargo });

        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);

        const cargo = new Cargo();
        cargo.idCargo = request.params.idCargo.toString();

        const excluiu = await this._cargoService.delete(cargo, funcionarioLogado);

        if (excluiu) {
            StandardResponse.noContent().send(response);
        } else {
            StandardResponse.notFound("Cargo não encontrado para exclusão", {
                cargos: [{ idCargo: cargo.idCargo }]
            }).send(response);
        }
    };

    /** Retorna a quantidade total de cargos cadastrados. */
    public count = async (request: Request, response: Response): Promise<void> => {
        log.debug("count()");
        const funcionarioLogado: Funcionario = this.getFuncionarioLogado(request);
        const total = await this._cargoService.count(funcionarioLogado);
        StandardResponse.success("Total de cargos obtido", { total }).send(response);
    };
}