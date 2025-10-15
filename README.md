# Turtletoy

Run [Turtletoy](https://turtletoy.net) turtle graphics code in the browser or Node.js. Turtletoy is an online platform where you can create generative art using a minimalistic JavaScript Turtle graphics API. 

## Demo

- [Turtletoy Example](https://reindernijhoff.github.io/turtletoy-package/).

This is a build from the repository's example/ directory.

![Example output](docs/screenshot.png)

## Installation

```sh
npm install turtletoy
```

## Basic Usage

```ts
import { turtleDraw } from 'turtletoy';

const { canvas } = turtleDraw(() => {
  Canvas.setpenopacity(1);
  
  const turtle = new Turtle();
  turtle.penup();
  turtle.goto(-50, -20);
  turtle.pendown();
  
  // Return the walk function
  return (i) => {
    turtle.forward(100);
    turtle.right(144);
    return i < 4;
  };
});

// Add canvas to your page
document.body.appendChild(canvas);
```

## ⚠️ Important: Syntax Difference from Turtletoy.net

**This package uses slightly different syntax than the code on [turtletoy.net](https://turtletoy.net)** to ensure compatibility with modern build tools and minification.

**If you use a `walk` function** (for animated/iterative drawing), the syntax differs:

### On turtletoy.net
```js
function walk(i) {
  turtle.forward(100);
  return i < 4;
}
```

### With this package
```ts
return (i) => {
  turtle.forward(100);
  return i < 4;
};
```

**Key difference:** Instead of defining a `walk` function, you must **return** the walk function at the end of your code. This is necessary for the code to work correctly when bundled and minified.

**Note:** The walk function is optional. If you don't need iterative drawing, simply don't return anything.

## API

### `turtleDraw(code, options)`

Executes Turtletoy code and returns a canvas with the drawing.

**Parameters:**
- `code`: String or function containing Turtletoy code
- `options`: Optional configuration object

**Options:**
- `htmlcanvas?: HTMLCanvasElement | OffscreenCanvas` - Use a custom canvas
- `raf?: boolean` - Use requestAnimationFrame for smooth rendering (default: false)
- `maxSteps?: number` - Maximum walk iterations (default: 100,000)
- `onStepError?: (error: unknown, step: number) => void` - Error handler for walk function
- `onDrawLine?: (x1: number, y1: number, x2: number, y2: number) => void` - Custom line drawing callback. When provided, no canvas is created and coordinates are in turtle world space (-100 to 100)

**Returns:**
```ts
{
  canvas: HTMLCanvasElement | OffscreenCanvas | null,  // null when using onDrawLine
  stop: () => void  // Stop rendering
}
```

## Examples

### Animated rendering

```ts
const { canvas, stop } = turtleDraw(myCode, { 
  raf: true  // Smooth frame-by-frame rendering
});
```

### Custom canvas

```ts
const myCanvas = document.createElement('canvas');
turtleDraw(myCode, { htmlcanvas: myCanvas });
```

### Error handling

```ts
turtleDraw(myCode, {
  onStepError: (error, step) => {
    console.error(`Error at step ${step}:`, error);
  }
});
```

### Custom line drawing

Use `onDrawLine` to intercept line drawing without using a canvas:

```ts
const lines = [];
turtleDraw(myCode, {
  onDrawLine: (x1, y1, x2, y2) => {
    // Coordinates are in turtle world space (-100 to 100)
    lines.push({ x1, y1, x2, y2 });
  }
});
// Process lines array for SVG, WebGL, etc.
```

## Turtletoy API

The full Turtletoy API documentation is available at [turtletoy.net/syntax](https://turtletoy.net/syntax).

Key features:
- **Turtle methods**: `forward()`, `backward()`, `left()`, `right()`, `goto()`, `circle()`
- **Pen control**: `penup()`, `pendown()`, `setpenopacity()`
- **Coordinate system**: -100 to 100 in both x and y
- **Output**: 2048×2048 canvas

## License

MIT License. See [LICENSE](LICENSE) for details.
