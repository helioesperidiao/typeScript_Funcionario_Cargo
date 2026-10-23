import { Request, Response } from "express";
import { FuncionarioService } from "../services/FuncionarioService";
import { Funcionario } from "../models/Funcionario";
import { StandardResponse } from "../http/StandardResponse";
import { Cargo } from "../models/Cargo";
import { BaseController } from "./BaseController";
import { ErrorResponse } from "../http/ErrorResponse";
import { createLogger } from "../logging/Logger";

const log = createLogger("FuncionarioController");

export class FuncionarioController extends BaseController {
    private _funcionarioService: FuncionarioService;

    constructor(funcionarioServiceDependency: FuncionarioService) {
        super();
        this._funcionarioService = funcionarioServiceDependency;
    }

    public login = async (request: Request, response: Response): Promise<void> => {
        log.debug("login()");

        const dados = this.requireBody(request, "funcionario");
        if (!dados.email || !dados.senha) {
            throw new ErrorResponse(400, "email e senha são obrigatórios");
        }

        const funcionario = new Funcionario();
        funcionario.email = dados.email;
        funcionario.senha = dados.senha;

        const resultado = await this._funcionarioService.loginFuncionario(funcionario);
        StandardResponse.success("Login efetuado com sucesso!", resultado).send(response);
    };

    public create = async (request: Request, response: Response): Promise<void> => {
        log.debug("create()");

        const funcionarioLogado = this.getFuncionarioLogado(request);
        const dados = this.requireBody(request, "funcionario");

        if (!dados.cargo?.idCargo) {
            throw new ErrorResponse(400, "cargo.idCargo é obrigatório");
        }
        if (!dados.senha) {
            throw new ErrorResponse(400, "senha é obrigatória");
        }

        const funcionario = new Funcionario();
        funcionario.nomeFuncionario = dados.nomeFuncionario;

        const cargo = new Cargo();
        cargo.idCargo = dados.cargo.idCargo.toString();
        funcionario.cargo = cargo;

        funcionario.email = dados.email;
        funcionario.recebeValeTransporte = dados.recebeValeTransporte;
        funcionario.senha = dados.senha;

        const resultado = await this._funcionarioService.create(funcionario, funcionarioLogado);
        StandardResponse.created("Cadastro realizado com sucesso", { funcionario: resultado }).send(response);
    };

    public findAll = async (request: Request, response: Response): Promise<void> => {
        log.debug("findAll()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const listaFuncionarios = await this._funcionarioService.findAll(funcionarioLogado);
        StandardResponse.success("Executado com sucesso", { funcionarios: listaFuncionarios }).send(response);
    };

    public findById = async (request: Request, response: Response): Promise<void> => {
        log.debug("findById()", { idFuncionario: request.params.idFuncionario });
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();
        const funcionario = await this._funcionarioService.findById(idFuncionario, funcionarioLogado);
        StandardResponse.success("Executado com sucesso", funcionario).send(response);
    };

    public update = async (request: Request, response: Response): Promise<void> => {
        log.debug("update()", { idFuncionario: request.params.idFuncionario });

        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();
        const dados = this.requireBody(request, "funcionario");

        if (!dados.cargo?.idCargo) {
            throw new ErrorResponse(400, "cargo.idCargo é obrigatório");
        }

        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;
        funcionario.nomeFuncionario = dados.nomeFuncionario;

        const cargo = new Cargo();
        cargo.idCargo = dados.cargo.idCargo;
        funcionario.cargo = cargo;

        funcionario.email = dados.email;
        funcionario.recebeValeTransporte = dados.recebeValeTransporte;

        // Só define a senha se foi enviada (evita apagar a senha atual)
        if (dados.senha !== undefined && dados.senha !== null && dados.senha !== "") {
            funcionario.senha = dados.senha;
        }

        const atualizou = await this._funcionarioService.updateFuncionario(funcionario, funcionarioLogado);

        if (!atualizou) {
            StandardResponse.notFound("Funcionário não encontrado para atualização", {
                funcionario: { idFuncionario }
            }).send(response);
            return;
        }

        StandardResponse.success("Atualizado com sucesso", {
            funcionario: {
                idFuncionario,
                nomeFuncionario: dados.nomeFuncionario
            }
        }).send(response);
    };

    public delete = async (request: Request, response: Response): Promise<void> => {
        log.debug("delete()", { idFuncionario: request.params.idFuncionario });

        const funcionarioLogado = this.getFuncionarioLogado(request);
        const idFuncionario = request.params.idFuncionario.toString();

        const funcionario = new Funcionario();
        funcionario.idFuncionario = idFuncionario;

        const excluiu = await this._funcionarioService.deleteFuncionario(funcionario, funcionarioLogado);

        if (!excluiu) {
            StandardResponse.notFound("Funcionário não encontrado", {
                message: `Não existe funcionário com id ${idFuncionario}`
            }).send(response);
            return;
        }

        StandardResponse.noContent().send(response);
    };

    public count = async (request: Request, response: Response): Promise<void> => {
        log.debug("count()");
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const total = await this._funcionarioService.count(funcionarioLogado);
        StandardResponse.success("Total de funcionários obtido", { total }).send(response);
    };

    public countByCargoId = async (request: Request, response: Response): Promise<void> => {
        log.debug("countByCargoId()", { idCargo: request.params.idCargo });
        const funcionarioLogado = this.getFuncionarioLogado(request);
        const cargoId = request.params.idCargo.toString();
        const total = await this._funcionarioService.countByCargoId(cargoId, funcionarioLogado);
        StandardResponse.success(`Total de funcionários com o cargo ID ${cargoId}`, { cargoId, total }).send(response);
    };
}