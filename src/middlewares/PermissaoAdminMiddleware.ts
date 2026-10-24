// src/middlewares/PermissaoAdminMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../http/ErrorResponse';
import { Funcionario } from '../models/Funcionario';
import { createLogger } from '../logging/Logger';

const log = createLogger("PermissaoAdminMiddleware");

export class PermissaoAdminMiddleware {
    /**
     * Exige que o funcionário logado (injetado previamente pelo JwtMiddleware)
     * tenha o cargo "Administrador".
     *
     * Deve ser usado SEMPRE depois de `jwtMiddleware.validateToken` na cadeia
     * de middlewares da rota.
     *
     * Em caso de falha, lança ErrorResponse(403), que é capturado pelo
     * error handler global em Server.ts e devolvido no formato StandardResponse.
     */
    public verificarPermissaoAdmin = (request: Request, _response: Response, next: NextFunction): void => {
        log.debug("verificarPermissaoAdmin()");

        const funcionarioLogado: Funcionario | undefined = (request as any).funcionarioLogado;

        if (!funcionarioLogado) {
            // Defesa em profundidade: se a rota for montada sem o JwtMiddleware
            // antes, não deixamos passar silenciosamente.
            log.warn("middleware executado sem funcionarioLogado no request");
            throw new ErrorResponse(401, "Funcionário não autenticado");
        }

        const cargo = funcionarioLogado.cargo?.nomeCargo;

        if (cargo !== "Administrador") {
            log.warn("acesso negado", {
                motivo: "não é administrador",
                cargoAtor: cargo ?? "desconhecido",
                email: funcionarioLogado.email,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${cargo ?? 'desconhecido'}" não é autorizado a executar esta operação.`
            });
        }

        next();
    };
}