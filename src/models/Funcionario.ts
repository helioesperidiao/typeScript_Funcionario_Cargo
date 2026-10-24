import { ObjectId } from "mongodb";
import { Cargo } from "./Cargo";

/** Representa um funcionário e centraliza validações dos dados principais. */
export class Funcionario {
    private _idFuncionario: string = '';
    private _cargo!: Cargo;
    private _nomeFuncionario: string = '';
    private _email: string = '';
    private _senha: string = '';
    private _recebeValeTransporte: number = 0;

    /** Cria também um Cargo vazio para que o modelo sempre tenha essa propriedade. */
    constructor() {
        this._cargo = new Cargo();
    }

    /** Devolve o ID do funcionário. */
    get idFuncionario(): string {
        return this._idFuncionario;
    }

    /** Valida e armazena um identificador MongoDB de funcionário. */
    set idFuncionario(value: string) {
        if (!value) {
            throw new Error("idFuncionario é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idFuncionario inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idFuncionario = value;
    }

    /** Devolve o cargo associado ao funcionário. */
    get cargo(): Cargo {
        return this._cargo;
    }

    /** Garante que o valor recebido seja uma instância válida de Cargo. */
    set cargo(value: Cargo) {
        if (!(value instanceof Cargo)) {
            throw new Error("cargo deve ser uma instância válida de Cargo.");
        }
        this._cargo = value;
    }

    /** Devolve o nome do funcionário. */
    get nomeFuncionario(): string {
        return this._nomeFuncionario;
    }

    /** Remove espaços externos e exige um nome com pelo menos três caracteres. */
    set nomeFuncionario(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeFuncionario deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeFuncionario deve ter pelo menos 3 caracteres.");
        }
        this._nomeFuncionario = nome;
    }

    /** Devolve o endereço de e-mail. */
    get email(): string {
        return this._email;
    }

    /** Valida o formato básico do e-mail antes de armazená-lo. */
    set email(value: string) {
        if (typeof value !== "string") {
            throw new Error("email deve ser uma string.");
        }
        const emailTrimmed = value.trim();
        if (emailTrimmed === "") {
            throw new Error("email não pode ser vazio.");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            throw new Error("email em formato inválido.");
        }
        this._email = emailTrimmed;
    }

    /** Devolve a senha ou o hash de senha mantido pelo modelo. */
    get senha(): string {
        return this._senha;
    }

    /** Armazena a senha; o serviço é responsável por protegê-la com hash. */
    set senha(value: string) {
        this._senha = value;
    }

    /** Devolve 1 quando recebe vale-transporte e 0 quando não recebe. */
    get recebeValeTransporte(): number {
        return this._recebeValeTransporte;
    }

    /** Aceita apenas 0 ou 1 como valor do campo vale-transporte. */
    set recebeValeTransporte(value: number) {
        if (![0, 1].includes(value)) {
            throw new Error("recebeValeTransporte deve ser 0 ou 1.");
        }
        this._recebeValeTransporte = value;
    }

    /** Retorna os dados públicos do funcionário, sem incluir a senha. */
    toJSON() {
        return {
            idFuncionario: this._idFuncionario,
            nomeFuncionario: this._nomeFuncionario,
            email: this._email,
            recebeValeTransporte: this._recebeValeTransporte,
            cargo: this._cargo
        };
    }
}