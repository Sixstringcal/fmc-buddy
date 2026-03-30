import { Observable } from "../core/Observable";
import { ViewModel } from "../core/ViewModel";
import { invertMoves } from "../utils/moveAlgebra";

export class ScrambleViewModel extends ViewModel {
    readonly scramble = new Observable<string>("");
    readonly showingInverse = new Observable<boolean>(false);
    readonly inverseScramble = new Observable<string>("");

    constructor() {
        super();

        const sync = () => {
            this.inverseScramble.set(invertMoves(this.scramble.get()));
        };

        this.addDisposable(this.scramble.subscribe(sync));
    }
}
