import { Canvas, Turtle, turtleDraw } from '../src/index.js';

// Run the turtle drawing
const { canvas } = turtleDraw(() => {
   
	// You can find the Turtle API reference here: https://turtletoy.net/syntax
	Canvas.setpenopacity(1);

	// Global code will be evaluated once.
	const turtle = new Turtle();
	turtle.penup();
	turtle.goto(-50,-20);
	turtle.pendown();

	// The walk function will be called until it returns false.
	function walk(i: number) {
		turtle.forward(100);
		turtle.right(144);
		return i < 4;
	}


}, { 
  raf: true 
});

// Add canvas to the page
const app = document.querySelector('#app');
if (app && canvas) {
  app.appendChild(canvas as HTMLCanvasElement);
}
