import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "../models/Funcionario";
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoService");

export class CargoService {
    private _cargoDAO: CargoDAO;
    private _funcionarioDAO: FuncionarioDAO;

    constructor(cargoDAODependency: CargoDAO, funcionarioDAODependency: FuncionarioDAO) {
        this._cargoDAO = cargoDAODependency;
        this._funcionarioDAO = funcionarioDAODependency;
    }

    private isAdmin(funcionario: Funcionario): boolean {
        return funcionario.cargo?.nomeCargo === "Administrador";
    }

    public create = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> => {
        log.debug("create()", { nomeCargo: cargo.nomeCargo });

        if (!this.isAdmin(funcionarioLogado)) {
            log.warn("criação de cargo negada", {
                motivo: "não é administrador",
                cargoAtor: funcionarioLogado.cargo?.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo?.nomeCargo ?? 'desconhecido'}" não é autorizado a criar cargos.`
            });
        }

        const resultado = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        if (resultado.length > 0) {
            throw new ErrorResponse(400, "Cargo já existe", {
                message: `O cargo "${cargo.nomeCargo}" já existe.`
            });
        }

        try {
            const criado = await this._cargoDAO.create(cargo);
            log.info("cargo criado", {
                idCargo: criado.idCargo,
                nomeCargo: criado.nomeCargo,
                criadoPor: funcionarioLogado.email,
            });
            return criado;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ErrorResponse(400, "Cargo já existe", {
                    message: `O cargo "${cargo.nomeCargo}" já existe.`
                });
            }
            log.error("falha ao criar cargo", { nomeCargo: cargo.nomeCargo, error: err });
            throw err;
        }
    };

    public findAll = async (_funcionarioLogado: Funcionario): Promise<Cargo[]> => {
        log.debug("findAll()");
        return await this._cargoDAO.findAll();
    };

    public findById = async (idCargo: string, _funcionarioLogado: Funcionario): Promise<Cargo | null> => {
        log.debug("findById()", { idCargo });
        const cargo = new Cargo();
        cargo.idCargo = idCargo;
        return await this._cargoDAO.findById(cargo.idCargo);
    };

    public update = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idCargo: cargo.idCargo });

        if (!this.isAdmin(funcionarioLogado)) {
            log.warn("atualização de cargo negada", {
                motivo: "não é administrador",
                cargoAtor: funcionarioLogado.cargo?.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo?.nomeCargo ?? 'desconhecido'}" não é autorizado a atualizar cargos.`
            });
        }

        const duplicados = await this._cargoDAO.findByField("nomeCargo", cargo.nomeCargo);
        const duplicadoDeOutro = duplicados.some(c => c.idCargo !== cargo.idCargo);
        if (duplicadoDeOutro) {
            throw new ErrorResponse(400, "Cargo já existe", {
                message: `O cargo "${cargo.nomeCargo}" já existe.`
            });
        }

        try {
            const atualizou = await this._cargoDAO.update(cargo);
            if (atualizou) {
                log.info("cargo atualizado", {
                    idCargo: cargo.idCargo,
                    nomeCargo: cargo.nomeCargo,
                    atualizadoPor: funcionarioLogado.email,
                });
            }
            return atualizou;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ErrorResponse(400, "Cargo já existe", {
                    message: `O cargo "${cargo.nomeCargo}" já existe.`
                });
            }
            throw err;
        }
    };

    public delete = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idCargo: cargo.idCargo });

        if (!this.isAdmin(funcionarioLogado)) {
            log.warn("exclusão de cargo negada", {
                motivo: "não é administrador",
                cargoAtor: funcionarioLogado.cargo?.nomeCargo,
            });
            throw new ErrorResponse(403, "Não autorizado", {
                message: `O cargo "${funcionarioLogado.cargo?.nomeCargo ?? 'desconhecido'}" não é autorizado a excluir cargos.`
            });
        }

        const total = await this._funcionarioDAO.countByCargoId(cargo.idCargo);
        if (total > 0) {
            log.warn("exclusão de cargo bloqueada", {
                idCargo: cargo.idCargo,
                funcionariosVinculados: total,
            });
            throw new ErrorResponse(400, "Não é possível excluir o cargo", {
                message: `Existem ${total} funcionário(s) vinculados a este cargo. Reatribua-os antes de excluir.`
            });
        }

        const excluiu = await this._cargoDAO.delete(cargo);
        if (excluiu) {
            log.info("cargo excluído", {
                idCargo: cargo.idCargo,
                excluidoPor: funcionarioLogado.email,
            });
        }
        return excluiu;
    };

    public count = async (_funcionarioLogado: Funcionario): Promise<number> => {
        log.debug("count()");
        return await this._cargoDAO.count();
    };
}