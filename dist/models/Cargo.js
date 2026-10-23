"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cargo = void 0;
const mongodb_1 = require("mongodb");
class Cargo {
    _idCargo = '';
    _nomeCargo = '';
    constructor() {
        console.log("⬆️  Cargo.constructor()");
    }
    get idCargo() {
        return this._idCargo;
    }
    set idCargo(value) {
        if (!value) {
            throw new Error("idCargo é obrigatório.");
        }
        if (!mongodb_1.ObjectId.isValid(value)) {
            throw new Error(`idCargo inválido: "${value}". Deve ser um ObjectId de 24 caracteres hexadecimais.`);
        }
        this._idCargo = value;
    }
    get nomeCargo() {
        return this._nomeCargo;
    }
    set nomeCargo(value) {
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
exports.Cargo = Cargo;
//# sourceMappingURL=Cargo.js.map