import { Engine } from "./engine.js";

// Turtle implementation
export class Turtle {
    private engine: Engine;
    private _x = 0;
    private _y = 0;
    private _h = 0;        // heading in radians
    private _pen = false;
    private _fullCircle = 360;
  
    constructor(x?: number, y?: number) {
      const e = Engine.current();
      if (!e) throw new Error("No active engine. Call turtleDraw(...) to run user code.");
      this.engine = e;
      this.goto(x || 0, y || 0);
      this.pendown();
    }
  
    // --- Move and draw ---
    forward(e: number) {
        const x = this.x() + e * Math.cos(this._h);
        const y = this.y() + e * Math.sin(this._h);
        this.goto(x, y);
    }
    
    backward(e: number) {
        this.forward(-e);
    }
    
    right(e: number) {
        this._h += this.toradians(e);
    }
    
    left(e: number) {
        this.right(-e);
    }
  
    pendown() {
        this._pen = true;
    }
    
    penup() {
        this._pen = false;
    }
    
    degrees(e?: number) {
        this._fullCircle = e ? e : 360;
    }
    
    radians() {
        this.degrees(Math.PI * 2);
    }
    
    goto(x: number | [number, number], y?: number) {
        const ox = this._x, oy = this._y;
        if (Array.isArray(x)) {
            this._x = x[0];
            this._y = x[1];
        } else {
            this._x = x || 0;
            this._y = y || 0;
        }
        if (this._pen) {
            this.engine.drawLine(ox, oy, this._x, this._y);
        }
    }
    
    jump(x: number | [number, number], y?: number) {
        if (Array.isArray(x)) {
            if (this.x() === x[0] && this.y() === x[1]) {
                return;
            }
        } else {
            if (this.x() === x && this.y() === y) {
                return;
            }
        }
        const pen = this.isdown();
        this.penup();
        this.goto(x, y);
        if (pen) {
            this.pendown();
        }
    }
    
    setx(e: number) {
        this.goto(e, this.y());
    }
    
    sety(e: number) {
        this.goto(this.x(), e);
    }
    
    toradians(e: number) {
        return e * (Math.PI * 2 / this._fullCircle);
    }
    
    setheading(e: number) {
        this._h = this.toradians(e);
    }
    
    home() {
        this.penup();
        this.goto(0, 0);
        this.seth(0);
        this.pendown();
    }
  
    circle(radius: number, extent?: number, steps?: number) {
        if (!extent) {
            extent = this._fullCircle;
        }
        const extRad = this.toradians(extent);
        if (!steps) {
            steps = Math.round(Math.abs(radius * extRad * 8)) | 0;
            steps = Math.max(steps, 4);
        }
        const cx = this.x() + radius * Math.cos(this._h + Math.PI / 2);
        const cy = this.y() + radius * Math.sin(this._h + Math.PI / 2);
        const a1 = Math.atan2(this.y() - cy, this.x() - cx);
        const a2 = radius >= 0 ? a1 + extRad : a1 - extRad;
        for (let i = 0; i < steps; i++) {
            const p = i / (steps - 1);
            const a = a1 + (a2 - a1) * p;
            const x = cx + Math.abs(radius) * Math.cos(a);
            const y = cy + Math.abs(radius) * Math.sin(a);
            this.goto(x, y);
        }
        if (radius >= 0) {
            this._h += extRad;
        } else {
            this._h -= extRad;
        }
    }
  
    position() {
        return [this._x, this._y];
    }
    
    xcor() {
        return this.position()[0];
    }
    
    ycor() {
        return this.position()[1];
    }
    
    heading() {
        return this._h / (Math.PI * 2) * this._fullCircle;
    }
    
    isdown() {
        return this._pen;
    }
    
    clone() {
        const t = new Turtle(this.x(), this.y());
        t.degrees(this._fullCircle);
        t.seth(this.heading());
        return t;
    }
    
    distance(x: number | [number, number], y: number = 0) {
        [x, y] = Array.isArray(x) ? x : [x, y];
        return Math.hypot((x as number) - this.x(), y - this.y());
    }
    
    towards(x: number | Turtle | [number, number], y: number = 0) {
        if (x instanceof Turtle) {
            [x, y] = [x.x(), x.y()];
        } else if (Array.isArray(x)) {
            [x, y] = x;
        }
        return (((Math.atan2(y - this.y(), (x as number) - this.x()) - this._h) / (Math.PI * 2) % 1 + 1) % 1) * this._fullCircle;
    }
    
    fullCircle() {
        return this._fullCircle;
    }
    
    // Aliases
    fd(e: number) { this.forward(e); }
    bk(e: number) { this.backward(e); }
    back(e: number) { this.backward(e); }
    lt(e: number) { this.left(e); }
    rt(e: number) { this.right(e); }
    pd() { this.pendown(); }
    down() { this.pendown(); }
    pu() { this.penup(); }
    up() { this.penup(); }
    setposition(x: number | [number, number], y?: number) { this.goto(x, y); }
    setpos(x: number | [number, number], y?: number) { this.goto(x, y); }
    jmp(x: number | [number, number], y?: number) { this.jump(x, y); }
    seth(e: number) { this.setheading(e); }
    pos() { return this.position(); }
    x() { return this.xcor(); }
    y() { return this.ycor(); }
    h() { return this.heading(); }
}