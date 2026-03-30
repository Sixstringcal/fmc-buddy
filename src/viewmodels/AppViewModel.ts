/**
 * AppViewModel — root coordinator.
 *
 * Owns the list of CubeNodeViewModels and the connection graph.  All cross-
 * cutting operations (create node, remove node, restore connections) live here
 * so no individual node VM has to know about its siblings.
 */
import { Observable } from "../core/Observable";
import { ViewModel } from "../core/ViewModel";
import { AppRepository } from "../repositories/AppRepository";
import { ConnectionRecord } from "../models/types";
import { CubeNodeViewModel } from "./CubeNodeViewModel";
import { ScrambleViewModel } from "./ScrambleViewModel";
import { TimerViewModel } from "./TimerViewModel";

interface CreateNodeOptions {
    initialMoves?: string;
    sourceId?: string;
    id?: string;
}

export class AppViewModel extends ViewModel {
    readonly scrambleVm: ScrambleViewModel;
    readonly timerVm: TimerViewModel;
    readonly cubeNodes = new Observable<CubeNodeViewModel[]>([]);
    readonly connections = new Observable<ConnectionRecord[]>([]);
    readonly isReady = new Observable<boolean>(false);

    constructor() {
        super();
        this.scrambleVm = new ScrambleViewModel();
        this.timerVm = new TimerViewModel(60 * 60);

        this.addDisposable(
            this.scrambleVm.scramble.subscribe((scramble) => {
                for (const node of this.cubeNodes.get()) {
                    node.scramble.set(scramble);
                }
            }),
        );
    }

    async bootstrap(): Promise<void> {
        const savedScramble = AppRepository.loadScramble();
        if (savedScramble.trim()) {
            this.scrambleVm.scramble.set(savedScramble);
        }

        const ids = AppRepository.loadCubeNodeIds();
        const nodes: CubeNodeViewModel[] = [];

        for (const id of ids) {
            const state = AppRepository.loadCubeNodeState(id);
            if (state) {
                const vm = new CubeNodeViewModel(
                    id,
                    this.scrambleVm.scramble.get(),
                    state,
                );
                nodes.push(vm);
            }
        }

        this.cubeNodes.set(nodes);

        const savedConnections = AppRepository.loadConnections();
        this.connections.set(savedConnections);

        this.isReady.set(true);
    }

    createCubeNode(options: CreateNodeOptions = {}): CubeNodeViewModel {
        const id = options.id ?? `cube-container-${Date.now()}`;
        const vm = new CubeNodeViewModel(id, this.scrambleVm.scramble.get());

        if (options.initialMoves != null) {
            vm.rawMoves.set(options.initialMoves);
        }

        this.cubeNodes.mutate((nodes) => nodes.push(vm));
        this._persistNodeList();

        if (options.sourceId) {
            this._addConnection({ sourceId: options.sourceId, targetId: id });
        }

        return vm;
    }

    removeCubeNode(id: string): void {
        const before = this.cubeNodes.get();
        const vm = before.find((n) => n.id === id);
        vm?.dispose();

        this.cubeNodes.set(before.filter((n) => n.id !== id));

        // Remove all edges touching this node.
        this.connections.set(
            this.connections
                .get()
                .filter((c) => c.sourceId !== id && c.targetId !== id),
        );

        AppRepository.deleteCubeNodeState(id);
        this._persistNodeList();
        this._persistConnections();
    }

    addConnection(connection: ConnectionRecord): void {
        const already = this.connections
            .get()
            .some(
                (c) =>
                    c.sourceId === connection.sourceId &&
                    c.targetId === connection.targetId,
            );
        if (!already) {
            this._addConnection(connection);
        }
    }

    reset(): void {
        for (const node of this.cubeNodes.get()) {
            node.dispose();
        }
        this.cubeNodes.set([]);
        this.connections.set([]);
        AppRepository.clearAll();
    }

    private _addConnection(connection: ConnectionRecord): void {
        this.connections.mutate((list) => list.push(connection));
        this._persistConnections();
    }

    private _persistNodeList(): void {
        AppRepository.saveCubeNodeIds(this.cubeNodes.get().map((n) => n.id));
    }

    private _persistConnections(): void {
        AppRepository.saveConnections(this.connections.get());
    }
}
