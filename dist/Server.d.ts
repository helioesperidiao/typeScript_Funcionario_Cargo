export declare class Server {
    private _porta;
    private _app;
    private _cargoRouter;
    private _funcionarioRouter;
    constructor(porta: number);
    init(): Promise<void>;
    private setupErrorMiddleware;
    run(): void;
}
//# sourceMappingURL=Server.d.ts.map