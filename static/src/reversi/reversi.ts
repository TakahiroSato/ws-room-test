import { canvas2d, vec2 } from "@takahiro_sato/canvas2d";

enum state {
    none = 0,
    white = 1,
    black = 2
}

class _ctx {
    protected c2d: canvas2d;
    constructor(c2d: canvas2d) {
        this.c2d = c2d;
    }
}

class disc extends _ctx {
    private _color: "black" | "white";
    private x: number;
    private y: number;
    private r: number;
    constructor(ctx: canvas2d, color: "black" | "white", x: number, y: number, r: number) {
        super(ctx);
        this._color = color;
        this.x = x;
        this.y = y;
        this.r = r;
    }
    public draw() {
        const color = this._color === "black" ? "#000000" : "#ffffff";
        this.c2d.fillCircle({
            cx: this.x + this.r,
            cy: this.y + this.r,
            r: this.r,
            color: color
        });
    }
}

export default class _reversi extends _ctx {
    private _width: number;
    private _height: number;
    private _states: number[][];
    constructor(c2d: canvas2d, width: number, height: number) {
        super(c2d);
        this._width = width;
        this._height = height;
        this._states = new Array();
        for (let i = 0; i < this._height; i++) {
            this._states[i] = new Array();
            for (let j = 0; j < this._width; j++) {
                this._states[i][j] = state.none;
            }
        }
    }
    public getPositionByScreenXY(x: number, y: number): { x: number, y: number } | null {
        if (x >= 0 && x <= this.c2d.width && y >= 0 && y <= this.c2d.height) {
            return {
                x: Math.floor(x / (this.c2d.width / this._width)),
                y: Math.floor(y / (this.c2d.height / this._height))
            }
        } else {
            return null;
        }
    }
    public setState(states: number[][]) {
        this._states = states;
    }
    public draw() {
        for (let y = 0; y < this._height; y++) {
            this.c2d.drawLines(
                [
                    new vec2((this.c2d.width * y) / this._width, 0),
                    new vec2((this.c2d.width * y) / this._width, this.c2d.height)
                ],
                { color: "#ffffff" }
            );
        }
        for (let x = 0; x < this._width; x++) {
            this.c2d.drawLines(
                [
                    new vec2(0, (this.c2d.height * x) / this._height),
                    new vec2(this.c2d.width, (this.c2d.height * x) / this._height)
                ],
                { color: "#ffffff" }
            );
        }
        this.drawDiscs();
    }
    private drawDiscs() {
        const r = this.c2d.width / this._width / 2;
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width; x++) {
                switch (this._states[y][x]) {
                    case state.black:
                        new disc(this.c2d, "black", x * r * 2, y * r * 2, r).draw();
                        break;
                    case state.white:
                        new disc(this.c2d, "white", x * r * 2, y * r * 2, r).draw();
                        break;
                    default:
                        break;
                }
            }
        }
    }
}
