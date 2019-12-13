import { canvasId } from "./c2d";

export enum keyCode {
    space = 32,
    left = 37,
    up = 38,
    right = 39,
    down = 40,
    F12 = 123
}

class _event {
    public keyDownEventListeners: { key: keyCode; listener: EventListener }[];
    private mouseDownEventListeners: EventListener[];
    private mouseMoveEventListeners: EventListener[];
    private mouseUpEventListeners: EventListener[];
    constructor() {
        this.keyDownEventListeners = new Array();
        this.mouseDownEventListeners = new Array();
        this.mouseMoveEventListeners = new Array();
        this.mouseUpEventListeners = new Array();
        this.init();
    }
    private _keyDownListenerBody(e: KeyboardEvent) {
        this.keyDownEventListeners
            .filter(l => l.key === e.keyCode)
            .map(l => {
                l.listener(e);
            });
        //if (e.keyCode !== keyCode.F12) e.preventDefault();
    }
    private _mouseDownListenerBody(e: MouseEvent) {
        console.log("aaaaa");
        console.log(this);
        this.mouseDownEventListeners.map(l => l(e));
    }
    private _mouseMoveListenerBody(e: MouseEvent) {
        this.mouseMoveEventListeners.map(l => l(e));
    }
    private _mouseUpListenerBody(e: MouseEvent) {
        this.mouseUpEventListeners.map(l => l(e));
    }
    public init() {
        window.removeEventListener("keydown", this._keyDownListenerBody);
        window.addEventListener("keydown", this._keyDownListenerBody);
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            document.getElementById(canvasId)?.removeEventListener("mousedown", this._mouseDownListenerBody);
            document.getElementById(canvasId)?.removeEventListener("mousemove", this._mouseMoveListenerBody);
            document.getElementById(canvasId)?.removeEventListener("mouseup", this._mouseUpListenerBody);
            document.getElementById(canvasId)?.addEventListener("mousedown", this._mouseDownListenerBody);
            document.getElementById(canvasId)?.addEventListener("mousemove", this._mouseMoveListenerBody);
            document.getElementById(canvasId)?.addEventListener("mouseup", this._mouseUpListenerBody);
        }
    }
    public addMouseDownEvent(listener: EventListener) {
        this.mouseDownEventListeners.push(listener);
    }
    public addMouseMoveEvent(listener: EventListener) {
        this.mouseMoveEventListeners.push(listener);
    }
    public addMouseUpEvent(listener: EventListener) {
        this.mouseUpEventListeners.push(listener);
    }
    public removeMouseDownEvents() {
        this.mouseDownEventListeners = new Array();
    }
    public removeMouseMoveEvents() {
        this.mouseMoveEventListeners = new Array();
    }
    public removeMouseUpEvents() {
        this.mouseUpEventListeners = new Array();
    }
}

export const event = new _event();
