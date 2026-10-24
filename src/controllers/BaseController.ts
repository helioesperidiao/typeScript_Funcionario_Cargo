// src/controllers/BaseController.ts
import { Request } from "express";
import { Funcionario } from "../models/Funcionario";
import { ErrorResponse } from "../http/ErrorResponse";

/** Reúne validações e conversões comuns aos controllers da API. */
export abstract class BaseController {
    /** Recupera do request o funcionário autenticado pelo middleware JWT. */
    protected getFuncionarioLogado(request: Request): Funcionario {
        const funcionarioLogadoJson = (request as any).funcionarioLogado;
        if (!funcionarioLogadoJson) {
            // ✅ 401 em vez de Error genérico (antes virava 500)
            throw new ErrorResponse(401, "Funcionário não autenticado");
        }

        const funcionarioLogado = new Funcionario();
        funcionarioLogado.idFuncionario = funcionarioLogadoJson.idFuncionario;
        funcionarioLogado.nomeFuncionario = funcionarioLogadoJson.nomeFuncionario;
        funcionarioLogado.email = funcionarioLogadoJson.email;
        if (funcionarioLogadoJson.cargo) {
            funcionarioLogado.cargo.idCargo = funcionarioLogadoJson.cargo.idCargo;
            funcionarioLogado.cargo.nomeCargo = funcionarioLogadoJson.cargo.nomeCargo;
        }

        return funcionarioLogado;
    }

    /**
     * Valida que o corpo da requisição contém um objeto obrigatório
     * (ex.: `{ funcionario: {...} }`, `{ cargo: {...} }`).
     * Lança ErrorResponse(400) caso contrário.
     */
    /** Exige um objeto com a chave indicada no corpo JSON da requisição. */
    protected requireBody(request: Request, key: string): any {
        const value = request.body?.[key];
        if (!value || typeof value !== "object") {
            throw new ErrorResponse(400, `Corpo da requisição inválido: "${key}" é obrigatório`);
        }
        return value;
    }
}