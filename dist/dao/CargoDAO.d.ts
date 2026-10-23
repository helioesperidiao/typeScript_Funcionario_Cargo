import { Cargo } from "../models/Cargo";
import { MongoDatabase } from "../database/MongoDatabase";
export declare class CargoDAO {
    private _database;
    constructor(dbInstance: MongoDatabase);
    private getCollection;
    create(cargo: Cargo): Promise<Cargo>;
    delete(objCargoModel: Cargo): Promise<boolean>;
    update(objCargoModel: Cargo): Promise<boolean>;
    findAll(): Promise<Cargo[]>;
    findById(idCargo: string): Promise<Cargo | null>;
    findByField(field: string, value: any): Promise<Cargo[]>;
    count(): Promise<number>;
    private toCargo;
}
//# sourceMappingURL=CargoDAO.d.ts.map