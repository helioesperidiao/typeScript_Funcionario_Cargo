"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncionarioDAO = void 0;
const mongodb_1 = require("mongodb");
const Funcionario_1 = require("../models/Funcionario");
const Cargo_1 = require("../models/Cargo");
class FuncionarioDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ FuncionarioDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("funcionario");
    }
    async create(objFuncionarioModel) {
        console.log("🟢 FuncionarioDAO.create()");
        const collection = await this.getCollection();
        if (!objFuncionarioModel.cargo) {
            throw new Error("Cargo não informado");
        }
        const senha = objFuncionarioModel._senha || objFuncionarioModel.senha || '';
        const doc = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            senha: senha,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
            cargoId: new mongodb_1.ObjectId(objFuncionarioModel.cargo.idCargo),
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir funcionário");
        }
        objFuncionarioModel.idFuncionario = result.insertedId.toHexString();
        return objFuncionarioModel;
    }
    async delete(objFuncionarioModel) {
        console.log(`🟢 FuncionarioDAO.delete(${objFuncionarioModel.idFuncionario})`);
        const collection = await this.getCollection();
        const filter = { _id: new mongodb_1.ObjectId(objFuncionarioModel.idFuncionario) };
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }
    async update(objFuncionarioModel) {
        console.log(`🟢 FuncionarioDAO.update(${objFuncionarioModel.idFuncionario})`);
        const collection = await this.getCollection();
        const filter = { _id: new mongodb_1.ObjectId(objFuncionarioModel.idFuncionario) };
        const updateData = {
            nomeFuncionario: objFuncionarioModel.nomeFuncionario,
            email: objFuncionarioModel.email,
            recebeValeTransporte: objFuncionarioModel.recebeValeTransporte,
        };
        const senha = objFuncionarioModel._senha || objFuncionarioModel.senha;
        if (senha) {
            updateData.senha = senha;
        }
        if (objFuncionarioModel.cargo?.idCargo) {
            updateData.cargoId = new mongodb_1.ObjectId(objFuncionarioModel.cargo.idCargo);
        }
        const update = { $set: updateData };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async findAll() {
        console.log("🟢 FuncionarioDAO.findAll()");
        const collection = await this.getCollection();
        const pipeline = [
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }
    async findById(idFuncionario) {
        console.log(`🟢 FuncionarioDAO.findById(${idFuncionario})`);
        const collection = await this.getCollection();
        const filter = { _id: new mongodb_1.ObjectId(idFuncionario) };
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();
        if (docs.length === 0)
            return null;
        return this.toFuncionario(docs[0]);
    }
    async findByField(field, value) {
        console.log(`🟢 FuncionarioDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "nomeFuncionario", "email", "recebeValeTransporte", "cargoId"];
        if (!allowedFields.includes(field)) {
            throw new Error(`Campo inválido para busca: ${field}`);
        }
        const collection = await this.getCollection();
        let filter = {};
        if (field === "_id") {
            filter = { _id: new mongodb_1.ObjectId(value) };
        }
        else {
            filter = { [field]: value };
        }
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toFuncionario(doc));
    }
    async findByEmail(email) {
        console.log(`🟢 FuncionarioDAO.findByEmail(${email})`);
        const collection = await this.getCollection();
        const pipeline = [
            { $match: { email } },
            {
                $lookup: {
                    from: "cargo",
                    localField: "cargoId",
                    foreignField: "_id",
                    as: "cargoInfo"
                }
            },
            {
                $unwind: {
                    path: "$cargoInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    _id: 0,
                    idFuncionario: "$_id",
                    nomeFuncionario: 1,
                    email: 1,
                    senha: 1,
                    recebeValeTransporte: 1,
                    cargo: {
                        idCargo: "$cargoInfo._id",
                        nomeCargo: "$cargoInfo.nomeCargo"
                    }
                }
            }
        ];
        const cursor = collection.aggregate(pipeline);
        const docs = await cursor.toArray();
        if (docs.length === 0) {
            return null;
        }
        return this.toFuncionario(docs[0]);
    }
    async count() {
        console.log("🟢 FuncionarioDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments();
    }
    async countByCargoId(cargoId) {
        console.log(`🟢 FuncionarioDAO.countByCargoId(${cargoId})`);
        const collection = await this.getCollection();
        return await collection.countDocuments({ cargoId: new mongodb_1.ObjectId(cargoId) });
    }
    toFuncionario(doc) {
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = doc.cargo.idCargo.toHexString ? doc.cargo.idCargo.toHexString() : doc.cargo.idCargo;
        cargo.nomeCargo = doc.cargo.nomeCargo;
        const funcionario = new Funcionario_1.Funcionario();
        funcionario.idFuncionario = doc.idFuncionario.toHexString ? doc.idFuncionario.toHexString() : doc.idFuncionario;
        funcionario.nomeFuncionario = doc.nomeFuncionario;
        funcionario.email = doc.email;
        funcionario._senha = doc.senha || '';
        funcionario.recebeValeTransporte = doc.recebeValeTransporte;
        funcionario.cargo = cargo;
        return funcionario;
    }
}
exports.FuncionarioDAO = FuncionarioDAO;
//# sourceMappingURL=FuncionarioDAO.js.map