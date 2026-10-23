"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoDAO = void 0;
const mongodb_1 = require("mongodb");
const Cargo_1 = require("../models/Cargo");
class CargoDAO {
    _database;
    constructor(dbInstance) {
        console.log("⬆️ CargoDAO.constructor()");
        this._database = dbInstance;
    }
    async getCollection() {
        const db = await this._database.getDb();
        return db.collection("cargo");
    }
    async create(cargo) {
        console.log("🟢 CargoDAO.create()");
        const collection = await this.getCollection();
        const doc = {
            nomeCargo: cargo.nomeCargo,
        };
        const result = await collection.insertOne(doc);
        if (!result.insertedId) {
            throw new Error("Falha ao inserir cargo");
        }
        cargo.idCargo = result.insertedId.toString();
        return cargo;
    }
    async delete(objCargoModel) {
        console.log("🟢 CargoDAO.delete(" + objCargoModel.idCargo + ")");
        const collection = await this.getCollection();
        const filter = { _id: new mongodb_1.ObjectId(objCargoModel.idCargo) };
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }
    async update(objCargoModel) {
        console.log("🟢 CargoDAO.update()");
        const collection = await this.getCollection();
        const filter = { _id: new mongodb_1.ObjectId(objCargoModel.idCargo) };
        const update = {
            $set: { nomeCargo: objCargoModel.nomeCargo }
        };
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async findAll() {
        console.log("🟢 CargoDAO.findAll()");
        const collection = await this.getCollection();
        const cursor = collection.find({});
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }
    async findById(idCargo) {
        console.log("🟢 CargoDAO.findById()");
        const collection = await this.getCollection();
        const filter = { _id: new mongodb_1.ObjectId(idCargo) };
        const doc = await collection.findOne(filter);
        return doc ? this.toCargo(doc) : null;
    }
    async findByField(field, value) {
        console.log(`🟢 CargoDAO.findByField() - Campo: ${field}, Valor: ${value}`);
        const allowedFields = ["_id", "nomeCargo"];
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
        const cursor = collection.find(filter);
        const docs = await cursor.toArray();
        return docs.map(doc => this.toCargo(doc));
    }
    async count() {
        console.log("🟢 CargoDAO.count()");
        const collection = await this.getCollection();
        return await collection.countDocuments();
    }
    toCargo(doc) {
        const cargo = new Cargo_1.Cargo();
        cargo.idCargo = doc._id.toHexString();
        cargo.nomeCargo = doc.nomeCargo;
        return cargo;
    }
}
exports.CargoDAO = CargoDAO;
//# sourceMappingURL=CargoDAO.js.map