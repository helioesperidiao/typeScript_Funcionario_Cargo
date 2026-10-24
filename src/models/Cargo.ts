import { ObjectId } from "mongodb";

/** Representa um cargo e valida os valores atribuídos às suas propriedades. */
export class Cargo {
    private _idCargo: string = '';
    private _nomeCargo: string = '';

    /** Inicializa o modelo; os campos começam vazios até serem preenchidos. */
    constructor() {}

    /** Devolve o ID do cargo. */
    get idCargo(): string {
        return this._idCargo;
    }

    /** Valida e armazena um ID MongoDB com 24 caracteres hexadecimais. */
    set idCargo(value: string) {
        if (!value) {
            throw new Error("idCargo é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idCargo inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idCargo = value;
    }

    /** Devolve o nome do cargo. */
    get nomeCargo(): string {
        return this._nomeCargo;
    }

    /** Remove espaços externos e valida o tamanho permitido para o nome. */
    set nomeCargo(value: string) {
        if (typeof value !== "string") {
            throw new Error("nomeCargo deve ser uma string.");
        }
        const nome = value.trim();
        if (nome.length < 3) {
            throw new Error("nomeCargo deve ter pelo menos 3 caracteres.");
        }
        if (nome.length > 64) {
            throw new Error("nomeCargo deve ter no máximo 64 caracteres.");
        }
        this._nomeCargo = nome;
    }

    /** Converte o modelo para um objeto simples que pode ser serializado em JSON. */
    toJSON() {
        return {
            idCargo: this._idCargo,
            nomeCargo: this._nomeCargo
        };
    }
}