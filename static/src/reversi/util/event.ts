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
  constructor() {
    this.keyDownEventListeners = [];

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      this.keyDownEventListeners
        .filter(l => l.key === e.keyCode)
        .map(l => {
          l.listener(e);
        });
      if (e.keyCode !== keyCode.F12) e.preventDefault();
    });
  }
  public addMouseDownEvent(callback: EventListener) {
    document.getElementById(canvasId)?.addEventListener("mousedown", callback);
  }
  public addMouseMoveEvent(callback: EventListener) {
    document.getElementById(canvasId)?.addEventListener("mousemove", callback);
  }
  public addMouseUpEvent(callBack: EventListener) {
    document.getElementById(canvasId)?.addEventListener("mouseup", callBack);
  }
}

export const event = new _event();
