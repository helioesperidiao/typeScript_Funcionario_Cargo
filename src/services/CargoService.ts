import { CargoDAO } from "../dao/CargoDAO";
import { FuncionarioDAO } from "../dao/FuncionarioDAO";
import { Cargo } from "../models/Cargo";
import { ErrorResponse } from "../http/ErrorResponse";
import { Funcionario } from "../models/Funcionario";
import { createLogger } from "../logging/Logger";

const log = createLogger("CargoService");

/** Aplica as regras de negócio antes de acessar cargos no banco. */
export class CargoService {
    private _cargoDAO: CargoDAO;
    private _funcionarioDAO: FuncionarioDAO;

    /** Recebe as dependências de persistência necessárias às regras de cargos. */
    constructor(cargoDAODependency: CargoDAO, funcionarioDAODependency: FuncionarioDAO) {
        this._cargoDAO = cargoDAODependency;
        this._funcionarioDAO = funcionarioDAODependency;
    }

    /** Cria um cargo, impedindo nomes duplicados. */
    public create = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<Cargo> => {
        log.debug("create()", { nomeCargo: cargo.nomeCargo });

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

    /** Retorna todos os cargos cadastrados. */
    public findAll = async (_funcionarioLogado: Funcionario): Promise<Cargo[]> => {
        log.debug("findAll()");
        return await this._cargoDAO.findAll();
    };

    /** Retorna o cargo com o identificador informado, ou null se não existir. */
    public findById = async (idCargo: string, _funcionarioLogado: Funcionario): Promise<Cargo | null> => {
        log.debug("findById()", { idCargo });
        const cargo = new Cargo();
        cargo.idCargo = idCargo;
        return await this._cargoDAO.findById(cargo.idCargo);
    };

    /** Atualiza um cargo, rejeitando um nome que já pertença a outro cargo. */
    public update = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("update()", { idCargo: cargo.idCargo });

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

    /** Exclui o cargo somente quando nenhum funcionário estiver associado a ele. */
    public delete = async (cargo: Cargo, funcionarioLogado: Funcionario): Promise<boolean> => {
        log.debug("delete()", { idCargo: cargo.idCargo });

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

    /** Conta os cargos cadastrados. */
    public count = async (_funcionarioLogado: Funcionario): Promise<number> => {
        log.debug("count()");
        return await this._cargoDAO.count();
    };
}