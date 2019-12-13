import { vec2 } from "@takahiro_sato/canvas2d";
import {event, c2d, init as c2dInit } from "./util";

enum state {
  none = 0,
  white = 1,
  black = 2
}

class disc {
  private _color: "black" | "white";
  private x: number;
  private y: number;
  private r: number;
  constructor(color: "black" | "white", x: number, y: number, r: number) {
    this._color = color;
    this.x = x;
    this.y = y;
    this.r = r;
  }
  public draw() {
    const color = this._color === "black" ? "#000000" : "#ffffff";
    if (c2d) {
        c2d.fillCircle({
          cx: this.x + this.r,
          cy: this.y + this.r,
          r: this.r,
          color: color
        });
    }
  }
}

export default class _reversi {
  private _width: number;
  private _height: number;
  private _states: number[][];
  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    this._states = new Array();
    for (let i = 0; i < this._height; i++) {
      this._states[i] = new Array();
      for (let j = 0; j < this._width; j++) {
        this._states[i][j] = state.none;
      }
    }
    if (!c2d) {
        c2dInit();
    }
  }
  public addMouseDownEvent(callBack: EventListener) {
    event.addMouseDownEvent((e: Event) => {
        callBack(e);
    });
  }
  public setState(states: number[][]) {
      this._states = states;
  }
  public draw() {
    if (!c2d) return;
    for (let y = 0; y < this._height; y++) {
      c2d.drawLines(
        [
          new vec2((c2d.width * y) / this._width, 0),
          new vec2((c2d.width * y) / this._width, c2d.height)
        ],
        { color: "#ffffff" }
      );
    }
    for (let x = 0; x < this._width; x++) {
      c2d.drawLines(
        [
          new vec2(0, (c2d.height * x) / this._height),
          new vec2(c2d.width, (c2d.height * x) / this._height)
        ],
        { color: "#ffffff" }
      );
    }
    this.drawDiscs();
  }
  private drawDiscs() {
    if (!c2d) return;
    const r = (c2d.width / this._width)/2;
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        switch (this._states[y][x]) {
            case state.black:
                (new disc("black", x*r*2, y*r*2, r)).draw();
                break;
            case state.white:
                (new disc("white", x*r*2, y*r*2, r)).draw();
                break;
            default:
                break;
        }
      }
    }
  }
}
