import { event, context } from "./util";
import reversi from "./reversi";

export default class {
    private reversi?: reversi;
    constructor() {}
    public init(canvasId: string) {
        context.init(canvasId);
        event.init();
        event.removeMouseDownEvents();
        this.reversi = new reversi(context.c2d, 8, 8);
        const animation = () => {
            if (!context.c2d) return;
            context.c2d.fillBackground("#004E2D");
            this.reversi?.draw();
            requestAnimationFrame(animation);
        };
        requestAnimationFrame(animation);
    }
    public setDiscs(discs: number[][]) {
        this.reversi?.setState(discs);
    }
    public getPositionByMouseDown(listener: (obj: {x: number, y: number}) => any) {
        event.addMouseDownEvent((e: MouseEvent) => {
            const pos = this.reversi?.getPositionByScreenXY(e.offsetX, e.offsetY);
            if (pos) {
                listener(pos);
            }
        })
    }
}