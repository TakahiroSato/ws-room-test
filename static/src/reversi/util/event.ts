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
    this.keyDownEventListeners = [];
    this.mouseDownEventListeners = [];
    this.mouseMoveEventListeners = [];
    this.mouseUpEventListeners = [];
    this.init();
  }
  private _keyDownListenerBody?: (e: KeyboardEvent) => any;
  private _mouseDownListenerBody?: (e: MouseEvent) => any;
  private _mouseMoveListenerBody?: (e: MouseEvent) => any;
  private _mouseUpListenerBody?: (e: MouseEvent) => any;
  private _removeAllEventListener() {
    if (this._keyDownListenerBody)
      window.removeEventListener("keydown", this._keyDownListenerBody);
    const canvas = document.getElementById(canvasId);
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
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      canvas.addEventListener("mousedown", this._mouseDownListenerBody);
      canvas.addEventListener("mousemove", this._mouseMoveListenerBody);
      canvas.addEventListener("mouseup", this._mouseUpListenerBody);
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
