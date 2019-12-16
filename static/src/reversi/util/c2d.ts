import { canvas2d } from "@takahiro_sato/canvas2d";

export default class context {
    private static _c2d: canvas2d;
    public static get c2d(): canvas2d {
        return context._c2d;
    }
    private static _canvasId: string;
    public static get canvasId(): string {
        return context._canvasId;
    }
    public static init(canvasId: string) {
        context._c2d = new canvas2d(canvasId);
        context._canvasId = canvasId;
    }
}
