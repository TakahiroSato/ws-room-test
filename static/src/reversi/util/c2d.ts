import { canvas2d } from "@takahiro_sato/canvas2d";

export const canvasId = "canvas2d";
export const init = () => {
    try {
        c2d = new canvas2d(canvasId);
    } catch (e) {
        console.error(e);
    }
}
export let c2d: canvas2d | null = null;

init();
