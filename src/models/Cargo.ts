import { ObjectId } from "mongodb";

export class Cargo {
    private _idCargo: string = '';
    private _nomeCargo: string = '';

    constructor() {}

    get idCargo(): string {
        return this._idCargo;
    }

    set idCargo(value: string) {
        if (!value) {
            throw new Error("idCargo é obrigatório.");
        }
        if (!ObjectId.isValid(value)) {
            throw new Error(`idCargo inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idCargo = value;
    }

    get nomeCargo(): string {
        return this._nomeCargo;
    }

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

    toJSON() {
        return {
            idCargo: this._idCargo,
            nomeCargo: this._nomeCargo
        };
    }
}