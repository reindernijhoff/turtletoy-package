// ---------- Internal engine & helpers ----------

export class Engine {
    static #current: Engine | null = null;
    static current() { return Engine.#current; }
    static __setCurrent(e: Engine | null) { Engine.#current = e; }
  
    readonly canvas: HTMLCanvasElement | OffscreenCanvas;
    private readonly ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    private readonly size = 2048;
    private readonly scale = this.size / 200;
    private penOpacity = 1; // [-1..1]
    private stroke = "rgba(0,0,0,1)";
  
    constructor(htmlcanvas?: HTMLCanvasElement | OffscreenCanvas) {
      this.canvas = htmlcanvas ?? this.#createCanvas();
      // enforce fixed size
      (this.canvas as any).width = this.size;
      (this.canvas as any).height = this.size;
      const ctx = (this.canvas as any).getContext?.("2d");
      if (!ctx) throw new Error("2D canvas context unavailable.");
      this.ctx = ctx;
  
      this.ctx.lineWidth = 1;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      
      // Enable anti-aliasing
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
      
      // default white background
      this.ctx.save();
      this.ctx.fillStyle = "#fff";
      this.ctx.fillRect(0, 0, this.size, this.size);
      this.ctx.restore();
  
      this._updateStroke();
    }
  
    setPenOpacity(v: number) {
      this.penOpacity = v;
      // fill background based on sign at the moment of setting
      this.ctx.save();
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.fillStyle = v < 0 ? "#000" : "#fff";
      this.ctx.fillRect(0, 0, this.size, this.size);
      this.ctx.restore();
      this._updateStroke();
    }
  
    drawLine(x1: number, y1: number, x2: number, y2: number) {
      const [px1, py1] = this.worldToCanvas(x1, y1);
      const [px2, py2] = this.worldToCanvas(x2, y2);
      this.ctx.beginPath();
      this.ctx.moveTo(px1, py1);
      this.ctx.lineTo(px2, py2);
      (this.ctx as any).strokeStyle = this.stroke;
      this.ctx.stroke();
    }
  
    worldToCanvas(x: number, y: number): [number, number] {
      const px = (x + 100) * this.scale;
      const py = (y + 100) * this.scale;
      return [px, py];
    }
  
    private _updateStroke() {
      const a = Math.min(1, Math.max(0, Math.abs(this.penOpacity)));
      const col = this.penOpacity < 0 ? 255 : 0;
      this.stroke = `rgba(${col},${col},${col},${a})`;
    }
  
    #createCanvas(): HTMLCanvasElement {
      if (typeof document !== "undefined" && typeof document.createElement === "function") {
        return document.createElement("canvas");
      }
      throw new Error("No canvas provided and DOM not available to create one.");
    }
  }
  