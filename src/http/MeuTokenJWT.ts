import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Cargo } from '../models/Cargo';
import { Funcionario } from '../models/Funcionario';
import { createLogger } from '../logging/Logger';

const log = createLogger("MeuTokenJWT");

/** Gera e valida tokens JWT usados para autenticar funcionários. */
export class MeuTokenJWT {
    private _key: string;
    private _alg: string;
    private _type: string;
    private _iss: string;
    private _aud: string;
    private _sub: string;
    private _duracaoToken: number;

    /** Carrega as opções do token a partir do ambiente ou de valores padrão. */
    constructor() {
        this._key = process.env.JWT_SECRET || "x9S4q0v+V0IjvHkG20uAxaHx1ijj+q1HWjHKv+ohxp/oK+77qyXkVj/l4QYHHTF3";
        this._alg = process.env.JWT_ALGORITHM || "HS256";
        this._type = process.env.JWT_TYPE || "JWT";
        this._iss = process.env.JWT_ISSUER || "http://localhost";
        this._aud = process.env.JWT_AUDIENCE || "http://localhost";
        this._sub = process.env.JWT_SUBJECT || "acesso_sistema";
        this._duracaoToken = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '', 10) || (3600 * 24 * 60);

        log.debug("configurado", {
            alg: this._alg,
            iss: this._iss,
            aud: this._aud,
            duracaoSegundos: this._duracaoToken,
        });
    }

    /** Assina um token com a identidade do funcionário e seu período de validade. */
    public gerarToken = (funcionario: Funcionario): string => {
        log.debug("gerarToken()", { idFuncionario: funcionario.idFuncionario });
        const headers = { alg: this._alg, typ: this._type };

        // O payload contém as informações que o servidor precisa nas rotas protegidas.
        const payload = {
            iss: this._iss,
            aud: this._aud,
            sub: this._sub,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this._duracaoToken,
            nbf: Math.floor(Date.now() / 1000),
            jti: crypto.randomBytes(16).toString("hex"),
            email: funcionario.email,
            cargo: {
                idCargo: funcionario.cargo.idCargo,
                nomeCargo: funcionario.cargo.nomeCargo
            },
            nomeFuncionario: funcionario.nomeFuncionario,
            idFuncionario: funcionario.idFuncionario
        };

        return jwt.sign(payload, this._key, {
            algorithm: this._alg as jwt.Algorithm,
            header: headers,
        });
    };

    /** Verifica assinatura e declarações do token; devolve null se ele for inválido. */
    public validarToken = (stringToken: string): Funcionario | null => {
        if (!stringToken || stringToken.trim() === "") {
            log.debug("token não fornecido ou vazio");
            return null;
        }

        const token = stringToken.replace("Bearer ", "").trim();

        try {
            // verify também confere expiração, emissor, público e algoritmo aceito.
            const decoded: any = jwt.verify(token, this._key, {
                algorithms: [this._alg as jwt.Algorithm],
                issuer: this._iss,
                audience: this._aud,
            });

            const cargo = new Cargo();
            if (decoded.cargo) {
                cargo.nomeCargo = decoded.cargo.nomeCargo;
                cargo.idCargo = decoded.cargo.idCargo;
            }

            const funcionario = new Funcionario();
            funcionario.idFuncionario = decoded.idFuncionario;
            funcionario.email = decoded.email;
            funcionario.nomeFuncionario = decoded.nomeFuncionario || '';
            funcionario.cargo = cargo;

            return funcionario;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                log.warn("token expirado");
            } else if (err instanceof jwt.JsonWebTokenError) {
                log.warn("token inválido");
            } else {
                log.error("erro ao validar token", { error: err });
            }
            return null;
        }
    };

    /** Lê a chave usada para assinar e verificar os tokens. */
    get key(): string { return this._key; }
    /** Substitui a chave usada para assinar e verificar os tokens. */
    set key(value: string) { this._key = value; }
    /** Lê o algoritmo configurado para assinar o token. */
    get alg(): string { return this._alg; }
    /** Define o algoritmo configurado para assinar o token. */
    set alg(value: string) { this._alg = value; }
    /** Lê o tipo informado no cabeçalho do token. */
    get type(): string { return this._type; }
    /** Define o tipo informado no cabeçalho do token. */
    set type(value: string) { this._type = value; }
    /** Lê quem emitiu o token (issuer). */
    get iss(): string { return this._iss; }
    /** Define quem emitiu o token (issuer). */
    set iss(value: string) { this._iss = value; }
    /** Lê o público esperado do token (audience). */
    get aud(): string { return this._aud; }
    /** Define o público esperado do token (audience). */
    set aud(value: string) { this._aud = value; }
    /** Lê o assunto que identifica a finalidade do token. */
    get sub(): string { return this._sub; }
    /** Define o assunto que identifica a finalidade do token. */
    set sub(value: string) { this._sub = value; }
    /** Lê o tempo de validade do token, em segundos. */
    get duracaoToken(): number { return this._duracaoToken; }
    /** Define o tempo de validade do token, em segundos. */
    set duracaoToken(value: number) { this._duracaoToken = value; }
}