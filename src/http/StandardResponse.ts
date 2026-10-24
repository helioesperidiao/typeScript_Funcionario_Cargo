/** Padroniza o formato JSON e o status HTTP das respostas da API. */
export class StandardResponse {
    private _success: boolean;
    private _message: string;
    private _data: any;
    private _error: any;
    private _httpCode: number;

    /** Mantém o construtor privado para criar respostas pelos métodos estáticos. */
    private constructor(
        success: boolean,
        httpCode: number,
        message: string,
        data: any = null,
        error: any = null
    ) {
        this._success = success;
        this._httpCode = httpCode;
        this._message = message;
        this._data = data;
        this._error = error;
    }

    /** Indica se a operação foi concluída com sucesso. */
    get success(): boolean { return this._success; }
    /** Retorna o status HTTP que será enviado ao cliente. */
    get httpCode(): number { return this._httpCode; }
    /** Retorna a mensagem principal da resposta. */
    get message(): string { return this._message; }
    /** Retorna os dados da resposta, quando houver. */
    get data(): any { return this._data; }
    /** Retorna os detalhes do erro, quando houver. */
    get error(): any { return this._error; }

    /** Monta o objeto serializável, omitindo dados ou erros que não foram informados. */
    public toJSON() {
        const response: any = { success: this._success, message: this._message };
        if (this._data !== null) response.data = this._data;
        if (this._error !== null) response.error = this._error;
        return response;
    }

    /** Envia a resposta; HTTP 204 exige resposta sem corpo. */
    public send(res: any) {
        if (this._httpCode === 204) {
            return res.status(204).end();
        }
        return res.status(this._httpCode).json(this.toJSON());
    }

    /** Cria uma resposta de sucesso, normalmente com status 200. */
    static success(message: string, data: any = null, httpCode: number = 200): StandardResponse {
        return new StandardResponse(true, httpCode, message, data, null);
    }

    /** Cria uma resposta de erro com status e detalhes opcionais. */
    static error(message: string, error: any = null, httpCode: number = 400): StandardResponse {
        return new StandardResponse(false, httpCode, message, null, error);
    }

    /** Cria uma resposta de sucesso HTTP 201, usada após um cadastro. */
    static created(message: string, data: any = null): StandardResponse {
        return StandardResponse.success(message, data, 201);
    }

    /** Cria uma resposta HTTP 204 sem conteúdo. */
    static noContent(): StandardResponse {
        return new StandardResponse(true, 204, "", null, null);
    }

    /** Cria uma resposta HTTP 404 para um recurso inexistente. */
    static notFound(message: string = "Recurso não encontrado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 404);
    }

    /** Cria uma resposta HTTP 401 para uma requisição não autenticada. */
    static unauthorized(message: string = "Não autorizado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 401);
    }

    /** Cria uma resposta HTTP 403 para uma operação sem permissão. */
    static forbidden(message: string = "Acesso negado", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 403);
    }

    /** Cria uma resposta HTTP 500 para falhas inesperadas. */
    static internalError(message: string = "Erro interno do servidor", error: any = null): StandardResponse {
        return StandardResponse.error(message, error, 500);
    }
}