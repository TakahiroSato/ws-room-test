import context from "./c2d";

export enum keyCode {
  space = 32,
  left = 37,
  up = 38,
  right = 39,
  down = 40,
  F12 = 123
}

export type MouseEevntListener = (e: MouseEvent) => any;

class _event {
  public keyDownEventListeners: { key: keyCode; listener: EventListener }[];
  private mouseDownEventListeners: MouseEevntListener[];
  private mouseMoveEventListeners: MouseEevntListener[];
  private mouseUpEventListeners: MouseEevntListener[];
  constructor() {
    this.keyDownEventListeners = [];
    this.mouseDownEventListeners = [];
    this.mouseMoveEventListeners = [];
    this.mouseUpEventListeners = [];
    this.init();
  }
  private _keyDownListenerBody?: (e: KeyboardEvent) => any;
  private _mouseDownListenerBody?: MouseEevntListener;
  private _mouseMoveListenerBody?: MouseEevntListener;
  private _mouseUpListenerBody?: MouseEevntListener;
  private _removeAllEventListener() {
    if (this._keyDownListenerBody)
      window.removeEventListener("keydown", this._keyDownListenerBody);
    const canvas = context.canvasId ? document.getElementById(context.canvasId) : null;
    if (canvas) {
      if (this._mouseDownListenerBody)
        canvas.removeEventListener("mousedown", this._mouseDownListenerBody);
      if (this._mouseMoveListenerBody)
        canvas.removeEventListener("mousemove", this._mouseMoveListenerBody);
      if (this._mouseUpListenerBody)
        canvas.removeEventListener("mouseup", this._mouseUpListenerBody);
    }
  }
  public init() {
    this._removeAllEventListener();
    this._keyDownListenerBody = (e: KeyboardEvent) => {
      this.keyDownEventListeners
        .filter(l => l.key === e.keyCode)
        .map(l => {
          l.listener(e);
        });
      //if (e.keyCode !== keyCode.F12) e.preventDefault();
    };
    this._mouseDownListenerBody = (e: MouseEvent) => {
      this.mouseDownEventListeners.map(l => l(e));
    };
    this._mouseMoveListenerBody = (e: MouseEvent) => {
      this.mouseMoveEventListeners.map(l => l(e));
    };
    this._mouseUpListenerBody = (e: MouseEvent) => {
      this.mouseUpEventListeners.map(l => l(e));
    };
    window.addEventListener("keydown", this._keyDownListenerBody);
    const canvas = context.canvasId ? document.getElementById(context.canvasId) : null;
    if (canvas) {
      canvas.addEventListener("mousedown", this._mouseDownListenerBody);
      canvas.addEventListener("mousemove", this._mouseMoveListenerBody);
      canvas.addEventListener("mouseup", this._mouseUpListenerBody);
    }
  }
  public addMouseDownEvent(listener: MouseEevntListener) {
    this.mouseDownEventListeners.push(listener);
  }
  public addMouseMoveEvent(listener: MouseEevntListener) {
    this.mouseMoveEventListeners.push(listener);
  }
  public addMouseUpEvent(listener: MouseEevntListener) {
    this.mouseUpEventListeners.push(listener);
  }
  public removeMouseDownEvents() {
    this.mouseDownEventListeners = [];
  }
  public removeMouseMoveEvents() {
    this.mouseMoveEventListeners = [];
  }
  public removeMouseUpEvents() {
    this.mouseUpEventListeners = [];
  }
}

export const event = new _event();
