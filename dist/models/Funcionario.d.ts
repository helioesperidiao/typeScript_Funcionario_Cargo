import { Cargo } from "./Cargo";
export declare class Funcionario {
    private _idFuncionario;
    private _cargo;
    private _nomeFuncionario;
    private _email;
    private _senha;
    private _recebeValeTransporte;
    constructor();
    get idFuncionario(): string;
    set idFuncionario(value: string);
    get cargo(): Cargo;
    set cargo(value: Cargo);
    get nomeFuncionario(): string;
    set nomeFuncionario(value: string);
    get email(): string;
    set email(value: string);
    get senha(): string;
    set senha(value: string);
    get recebeValeTransporte(): number;
    set recebeValeTransporte(value: number);
    toJSON(): {
        idFuncionario: string;
        nomeFuncionario: string;
        email: string;
        recebeValeTransporte: number;
        cargo: Cargo;
    };
}
//# sourceMappingURL=Funcionario.d.ts.map