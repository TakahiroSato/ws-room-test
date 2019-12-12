import { c2d, init as c2dInit } from "./util";
import reversi from "./reversi";

export default class {
    private reversi: reversi;
    constructor() {
        this.reversi = new reversi(8, 8);
    }
    public init() {
        c2dInit();
        this.reversi.setState([
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 2, 0, 0, 0],
            [0, 0, 0, 2, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ]);

        const animation = () => {
            if (!c2d) return;
            c2d.fillBackground("#004E2D");
            this.reversi.draw();
            requestAnimationFrame(animation);
        };
        requestAnimationFrame(animation);
    }
}