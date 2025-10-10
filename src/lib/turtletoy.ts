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
  };

  type UserCodeFactory = (Canvas: any, Turtle: any) => { walk: null | ((i: number) => boolean) };
  
  export function turtleDraw(userCode: string | (() => void), opts: TurtleDrawOptions = {}) {
    const engine = new Engine(opts.htmlcanvas);
    Canvas.__attachRuntime(engine);
    Engine.__setCurrent(engine);
  
    const body = typeof userCode === "function"
      ? fnBody(userCode)
      : String(userCode);
  
    // Execute global code, then capture optional walk
    const factory = new Function(
      "Canvas",
      "Turtle",
      `"use strict";
  ${body}
  return { walk: (typeof walk === "function") ? walk : null };`
    ) as UserCodeFactory;
  
    const { walk } = factory(Canvas, Turtle);
  
    let stopped = false;
    let i = 0;
    const maxSteps = opts.maxSteps ?? 1_000_000;
  
    const stepOnce = () => {
      if (stopped || !walk) return false;
      try {
        const keep = walk(i++);
        if (keep === false || i >= maxSteps) return false;
      } catch (e) {
        opts.onStepError?.(e, i);
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
  
  
  function fnBody(fn: Function) {
    const src = fn.toString();
    return src.slice(src.indexOf("{") + 1, src.lastIndexOf("}"));
  }