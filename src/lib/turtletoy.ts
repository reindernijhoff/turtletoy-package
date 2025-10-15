// turtle-runtime.ts
// Minimal Turtletoy-compatible runtime for browser/worker environments.
// API spec: https://turtletoy.net/syntax

import { Engine } from "./engine.js";
import { Canvas } from "./canvas.js";
import { Turtle } from "./turtle.js";

// Runner
  export type TurtleDrawOptions = {
    htmlcanvas?: HTMLCanvasElement | OffscreenCanvas;
    raf?: boolean;
    maxSteps?: number;
    onStepError?: (e: unknown, i: number) => void;
    onDrawLine?: (x1: number, y1: number, x2: number, y2: number) => void;
  };

  type UserCodeFactory = (Canvas: any, Turtle: any) => { walk?: ((i: number, t:number) => boolean) };
  type WalkFunction = (i: number, t: number) => boolean;
  type UserCodeFunction = () => void | WalkFunction | { walk?: WalkFunction };
  
  export function turtleDraw(userCode: string | UserCodeFunction, opts: TurtleDrawOptions = {}) {
    const engine = new Engine(opts.htmlcanvas, opts.onDrawLine);
    Canvas.__attachRuntime(engine);
    Engine.__setCurrent(engine);
  
    let walk: ((i: number, t: number) => boolean) | null | undefined = null;
    
    if (typeof userCode === "function") {
      // Call function directly - preserves closures and minified references
      const result = userCode();
      // Support both direct function return and object with walk property
      if (typeof result === "function") {
        walk = result;
      } else {
        walk = result?.walk;
      }
    } else {
      // Execute string code
      const body = String(userCode);
      const factory = new Function(
        "$Canvas",
        "$Turtle",
        `
const Canvas = $Canvas;
const Turtle = $Turtle;
${body}
return { walk: (typeof walk === "function") ? walk : undefined };`
      ) as UserCodeFactory;
      
      const result = factory(Canvas, Turtle);
      walk = result.walk;
    }
  
    let stopped = false;
    let i = 0;
    const maxSteps = opts.maxSteps ?? 1_000_000;
  
    const stepOnce = () => {
      if (stopped || !walk) return false;
      try {
        const keep = walk(i++, 1);
        if (keep === false || i >= maxSteps) {
          stopped = true;
          return false;
        }
      } catch (e) {
        opts.onStepError?.(e, i);
        stopped = true;
        return false;
      }
      return true;
    };
  
    if (walk) {
      if (opts.raf && typeof requestAnimationFrame !== "undefined") {
        const loop = () => {
          if (stopped) return;
          // do steps until 10ms elapsed to keep UI responsive
          const startTime = performance.now();
          while ((performance.now() - startTime) < 10 && stepOnce()) { /* tight loop */ }
          if (!stopped && i < maxSteps) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      } else {
        while (stepOnce()) { /* synchronous run */ }
      }
    }
  
    return {
      canvas: engine.canvas,
      stop() { stopped = true; },
    };
  }