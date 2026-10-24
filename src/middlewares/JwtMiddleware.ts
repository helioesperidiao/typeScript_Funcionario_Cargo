import { Request, Response, NextFunction } from 'express';
import { MeuTokenJWT } from '../http/MeuTokenJWT';
import { ErrorResponse } from '../http/ErrorResponse';
import { Funcionario } from '../models/Funcionario';
import { createLogger } from '../logging/Logger';

const log = createLogger("JwtMiddleware");

/** Middleware que autentica a requisição usando o token do cabeçalho HTTP. */
export class JwtMiddleware {
    /** Valida o token e disponibiliza o funcionário autenticado no request. */
    public validateToken = (request: Request, _response: Response, next: NextFunction): void => {
        log.debug("validateToken()");

        const authorization = request.headers.authorization;
        const jwt = new MeuTokenJWT();
        const funcionario: Funcionario | null = jwt.validarToken(authorization as string);

        if (!funcionario) {
            log.warn("token inválido ou ausente");
            throw new ErrorResponse(401, "Token inválido");
        }

        (request as any).funcionarioLogado = funcionario;
        next();
    };
}