import { Canvas, Turtle, turtleDraw } from '../src/index.js';

// Run the turtle drawing
const { canvas } = turtleDraw(() => {
// Cubic cityscape #1. Created by Reinder Nijhoff 2018
// @reindernijhoff
//
// https://turtletoy.net/turtle/789cce3829
//

// Try different settings here:

const useOrthoGraphicPerspective = Math.random() > .5;
const towerness = .25; // [0, 1)
const topDownView = Math.random() > .5;
const addHatching = Math.random() > .5;

// A lot of ugly code:

Canvas.setpenopacity(1);

const turtle = new Turtle();
let viewMatrix;
let projectionMatrix;
let viewProjectionMatrix;

let polygonList = [];
const lineSegmentsDrawn = []; // keep track of all line segments. Don't draw duplicates

const width = 30;
const depth = 70;

const camPos = [12,topDownView?13.5:-10.5,-2.3]; 
const camLookat = [19,topDownView?9.5:-6,-10];

function walk(i) {
    if (i == 0) {
        setupCamera();
    }
    
    for (let j=0; j<width; j++) {
        const x = (width - j + (i+1)/2|0) - (width-20);
        const z = -(j + i/2|0) + (width-20);
        const y = (x-z-40); // 2

        drawHome(turtle,   [x,y,z], true);
    }
    return i < depth;
}

function createWall() {
    return[createSquare([0,0,0], [1,1,0])]; // wall
}

function createWallDecoration(floorLevel) {
    const p = [];
    for (let i=0; i<2; i++) {
        const x = .2+i*.4;
        if (Math.random() > .5) {
            p.push(createSquare([x,0.3,0], [x+.2,.7,0])); // window
        } else if (floorLevel && Math.random() > .7) {
            p.push(createSquare([x,0,0], [x+.2,.7,0])); // door
        }
    }
    
    return p;
}

function createRoof() {
    const p = [];
    let flat = false;
    
    if (Math.random() > .5) {
        p.push(createSquare([0,1,0], [1,1,-1])); // roof
        flat = true;
    } else {
        p.push(createSquare([0,1,0], [1,1.5,-.5])); // roof
        p.push(createSquare([0,1,-1], [1,1.5,-.5]).reverse()); // roof
        p.push([[0,1,-1],[0,1.5,-.5],[0,1,0]]);
        p.push([[1,1,0],[1,1.5,-.5],[1,1,-1]]);
        if (Math.random() > .5) {
            return {flatRoof: false, flipped: true, polygons: flipxz(p)};
        }
    }
    return {flatRoof: flat, flipped: false, polygons: p};
}

function drawHome(turtle, loc, floorLevel) {
    let p = [];
    const occluders = [];
    let roof = false;
    
    p = p.concat(center(createWall(), loc));
    p = p.concat(center(flipxz(createWall()), loc));

    p = p.concat(center(createWallDecoration(floorLevel), loc));
    p = p.concat(center(flipxz(createWallDecoration(floorLevel)), loc));
    
    if (Math.random() > 1-towerness) { // extra level
        drawHome(turtle, add3(loc,[0,1,0]), false);
    } else {
        roof = createRoof();
        p = p.concat(center(roof.polygons, loc));
    }

    for (let i=0; i<p.length; i++) {
        const polygon = new Polygon();
        const vl = p[i];

        const vd = useOrthoGraphicPerspective ? 
            sub3(camLookat, camPos) : sub3(scale3(add3(vl[0],vl[2]),.5), camPos);
        let normal = cross3(sub3(vl[1],vl[0]),sub3(vl[2],vl[0]));
        if (dot3(normal,vd) < 0 ) {
            continue;
        }
        
        for (let j=0; j<vl.length; j++) {
            const v = transform4(vl[j], viewProjectionMatrix);
            if (useOrthoGraphicPerspective) {
                polygon.cp.push([(v[0]*2.5), -(v[1]*2.5)]);
            } else {
                polygon.cp.push([(v[0]/v[3]*50), -(v[1]/v[3]*50)]);
            }
        } 
        let vis = false;
        for (let j=0; j<polygon.cp.length; j++) {
            if (Math.abs(polygon.cp[j][0]) < 100 && Math.abs(polygon.cp[j][1]) < 100) {
                vis = true;
            }
        }
        
        if (!vis) {
            continue;
        }
        
        if (i<2) { // first two are walls
            polygon.dp.push(new LineSegment(polygon.cp[0], polygon.cp[1]));
            if (roof && !topDownView) {
                if (roof.flatRoof || (roof.flipped && i == 1) || (!roof.flipped && i == 0)) {
                    polygon.dp.push(new LineSegment(polygon.cp[1], polygon.cp[2]));
                }
            }
            polygon.dp.push(new LineSegment(polygon.cp[2], polygon.cp[3]));
        } else if (polygon.cp.length === 3) { // roof
            polygon.dp.push(new LineSegment(polygon.cp[0], polygon.cp[1]));
            polygon.dp.push(new LineSegment(polygon.cp[1], polygon.cp[2]));
        } else {
            polygon.addOutline();
        }
        
        if (addHatching) {
            normal = normalize3(normal);
            if (normal[2] < 0) {
                polygon.addHatching(.85, .75);
            }
        }
        
        const occluder = drawPolygon(turtle, polygon);
        
        if (i<2) { // first two are walls
            occluders.push(polygon);
        } else if (occluder) {
            occluders.push(occluder);
        }
    }
    polygonList = polygonList.concat(occluders);
}

function drawPolygon(turtle, p) {
    for (let j=0; j<polygonList.length; j++) {
        if(!p.boolean(polygonList[j])) {
            return;
        }
    }
    p.draw(turtle);
    return p;
}

function setupCamera() {
    viewMatrix = lookAt4m(camPos, camLookat, [0,1,0]);
    projectionMatrix = perspective4m(0.4, 1);
    viewProjectionMatrix = multiply4m(projectionMatrix, viewMatrix);
}

// helper functions
function flipxz(p) {
     for (let i=0; i<p.length; i++) {
        const vl = p[i];
        for (let j=0; j<vl.length; j++) {
            p[i][j] = [-vl[j][2],vl[j][1],vl[j][0]-1];
        }
    }
    return p;
}

function center(p, loc) {
    const ret = [];
    for (let i=0; i<p.length; i++) {
        const vl = p[i], v = [];
        for (let j=0; j<vl.length; j++) {
            v.push(add3(vl[j], loc));
        }
        ret.push(v);
    }
    return ret;
}

function createSquare(lb, rt) {
    return [lb,[lb[0],rt[1],rt[2]],rt,[rt[0],lb[1],lb[2]]];
}

// polygon functions
class LineSegment {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
    unique() {
        for (let i=0, l=lineSegmentsDrawn.length; i<l; i++) {
            const ls = lineSegmentsDrawn[i];
            if ( (equal2(this.p1, ls.p1) && equal2(this.p2, ls.p2)) ||
                 (equal2(this.p1, ls.p2) && equal2(this.p2, ls.p1)) ){
                return false;
            }
        }
        lineSegmentsDrawn.push(this);
        return true;
    }
}

class Polygon {
    constructor() {
        this.cp = []; // clip path: array of [x,y] pairs
        this.dp = []; // 2d line to draw: array of linesegments
    }
    addOutline(s=0) {
        for (let i=s, l=this.cp.length; i<l; i++) {
            this.dp.push(new LineSegment(this.cp[i], this.cp[(i+1)%l]));
        }
    }
    createPoly(x,y,c,r,a) {
        this.cp = [];
        for (let i=0; i<c; i++) {
            this.cp.push( [x + Math.sin(i*Math.PI*2/c+a) * r, y + Math.cos(i*Math.PI*2/c+a) * r] );
        }
    }
    addHatching(a,d) {
        // todo, create a tight bounding polygon, for now fill screen
        const tp = new Polygon();
        tp.createPoly(0,0,4,200,Math.PI*.5);
        const dx = Math.sin(a)*d, dy = Math.cos(a)*d;
        const cx = Math.sin(a)*200, cy = Math.cos(a)*200;
        for (let i = .5; i<150/d; i++) {
            tp.dp.push(new LineSegment([dx*i+cy,dy*i-cx], [dx*i-cy,dy*i+cx]));
            tp.dp.push(new LineSegment([-dx*i+cy,-dy*i-cx], [-dx*i-cy,-dy*i+cx]));
        }
        tp.boolean(this, false);
        this.dp = this.dp.concat(tp.dp);
    }
    draw(t) {
        if (this.dp.length ==0) {
            return;
        }
        for (let i=0, l=this.dp.length; i<l; i++) {
            const d = this.dp[i];
            if (d.unique()) {
                if (!equal2(d.p1, t.pos())) {
                    t.penup();
                    t.goto(d.p1);
                    t.pendown();   
                }
                t.goto(d.p2);
            }
        }
    }
    inside(p) {
        // find number of intersections from p to far away - if even you're outside
        const p1 = [0, -1000];
        let int = 0;
        for (let i=0, l=this.cp.length; i<l; i++) {
            if (segment_intersect2(p, p1, this.cp[i], this.cp[(i+1)%l])) {
                int ++;
            }    
        }
        return int & 1;
    }
    boolean(p, diff = true) {
        // very naive polygon diff algorithm - made this up myself
        const ndp = [];
        for (let i=0, l=this.dp.length; i<l; i++) {
            const ls = this.dp[i];
            
            // find all intersections with clip path
            const int = [];
            for (let j=0, cl=p.cp.length; j<cl; j++) {
                const pint = segment_intersect2(ls.p1,ls.p2,p.cp[j],p.cp[(j+1)%cl]);
                if (pint) {
                    int.push(pint);
                }
            }
            if (int.length == 0) { // 0 intersections, inside or outside?
                if (diff != p.inside(ls.p1)) {
                    ndp.push(ls);
                }
            } else {
                int.push(ls.p1); int.push(ls.p2);
                // order intersection points on line ls.p1 to ls.p2
                const cmp = sub2(ls.p2,ls.p1);
                int.sort((a,b) => dot2(sub2(a,ls.p1),cmp)-dot2(sub2(b,ls.p1),cmp));
                
                for (let j=0; j<int.length-1; j++) {
                    if (!equal2(int[j], int[j+1]) && 
                        diff != p.inside(scale2(add2(int[j],int[j+1]),.5))) {
                        ndp.push(new LineSegment(int[j], int[j+1]));
                    }
                }
            }
        }
        this.dp = ndp;
        return this.dp.length > 0;
    }
}

// vec2 functions
const equal2=(a,b)=>0.001>dist_sqr2(a,b);
const scale2=(a,b)=>[a[0]*b,a[1]*b];
const add2=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const sub2=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const dot2=(a,b)=>a[0]*b[0]+a[1]*b[1];
const dist_sqr2=(a,b)=>(a[0]-b[0])*(a[0]-b[0])+(a[1]-b[1])*(a[1]-b[1]);
const segment_intersect2=(a,b,d,c)=>{
    const e=(c[1]-d[1])*(b[0]-a[0])-(c[0]-d[0])*(b[1]-a[1]);
    if(0==e)return false;
    c=((c[0]-d[0])*(a[1]-d[1])-(c[1]-d[1])*(a[0]-d[0]))/e;
    d=((b[0]-a[0])*(a[1]-d[1])-(b[1]-a[1])*(a[0]-d[0]))/e;
    return 0<=c&&1>=c&&0<=d&&1>=d?[a[0]+c*(b[0]-a[0]),a[1]+c*(b[1]-a[1])]:false;
}
// vec3 functions
const scale3=(a,b)=>[a[0]*b,a[1]*b,a[2]*b];
const len3=(a)=>Math.sqrt(dot3(a,a));
const normalize3=(a)=>scale3(a,1/len3(a));
const add3=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// vec4 functions
const transform4=(a,b)=>{
    const d=new Float32Array(4);
    for(let c=0;4>c;c++)d[c]=b[c]*a[0]+b[c+4]*a[1]+b[c+8]*a[2]+b[c+12];
    return d;
}
// mat4 functions
const lookAt4m=(a,b,d)=>{ // pos, lookAt, up
    const c=new Float32Array(16);
    b=normalize3(sub3(a,b));
    d=normalize3(cross3(d,b));
    const e=normalize3(cross3(b,d));
    c[0]=d[0];c[1]=e[0];c[2]=b[0];c[3]=0;
    c[4]=d[1];c[5]=e[1];c[6]=b[1];c[7]=0;
    c[8]=d[2];c[9]=e[2];c[10]=b[2];c[11]=0;
    c[12]=-(d[0]*a[0]+d[1]*a[1]+d[2]*a[2]);
    c[13]=-(e[0]*a[0]+e[1]*a[1]+e[2]*a[2]);
    c[14]=-(b[0]*a[0]+b[1]*a[1]+b[2]*a[2]);
    c[15]=1;
    return c;
}
const multiply4m=(a,b)=>{
    const d=new Float32Array(16);
    for(let c=0;16>c;c+=4)
        for(let e=0;4>e;e++)
            d[c+e]=b[c+0]*a[0+e]+b[c+1]*a[4+e]+b[c+2]*a[8+e]+b[c+3]*a[12+e];
    return d;
}
const perspective4m=(a,b)=>{ // fovy, aspect
    const c=(new Float32Array(16)).fill(0,0);
    c[5]=1/Math.tan(a/2);
    c[0]=c[5]/b;
    c[10]=c[11]=-1;
    return c;
}
}, { 
  raf: true 
});

// Add canvas to the page
const app = document.querySelector('#app');
if (app && canvas) {
  app.appendChild(canvas as HTMLCanvasElement);
}
