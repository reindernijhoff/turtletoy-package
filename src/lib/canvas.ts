import { Engine } from "./engine.js";

// Public exports
export const Canvas = (() => {
    let engine: Engine | null = null;
    let penOpacityWasSet = false;
  
    return {
      // Called by turtleDraw to wire up rendering target
      __attachRuntime(e: Engine) { engine = e; },
  
      // Canvas API (per docs)
      setpenopacity(op: number) {
        if (!engine) throw new Error("Canvas not initialized. Call turtleDraw(...) first.");
        // valid range -1..1. Clamp and remember first value (spec suggests set once).
        if (penOpacityWasSet) return;
        penOpacityWasSet = true;
        const v = Math.max(-1, Math.min(1, op));
        engine.setPenOpacity(v);
      },
  
      // Helper: access the underlying canvas (useful to embed in DOM)
      get element() { return engine?.canvas ?? null; },
    };
  })();