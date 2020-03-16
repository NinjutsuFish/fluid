//as close to oob as i can find online
//Leo Harford 2020
//fluid simulation with an incompressable fluid with a little bit of dye in it to see it diffuse
//works with a vector field
//An implementation/port of https://mikeash.com/pyblog/fluid-simulation-for-dummies.html
//globals
var HEIGHT = 256;
var WIDTH = 256;
var iter=16 //how many times we run over the uipdate thing. more time the morea accurate
var N = 256
//util functions
var j
var _force = 0;
var _viscosity = 0;
var _diffusion = 0;
var sources = [];






Array.min = function( array ){
    return Math.min.apply( Math, array );
};


function mouseHandler(canvas,e,ctx){
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY -  rect.top;
    x=Math.floor(x/2)
    if(x==0){x+=3}
    if(x>=255){x-=3}
    y=Math.floor(y/2)
    if(y==0){y+=3}
    if(y>=255){y-=3}

    if(e.button == 0 ){//if left clicking
        j.addDensity(x+1,y,10);
        j.addDensity(x,y+1,10);
        j.addDensity(x+1,y+1,10);
        j.addDensity(x,y,10);
        if(document.getElementById("dye_velocity").checked == true){j.addVelocity(x,y,40*(Math.random()-1),40*(Math.random()-1))}
        }
    else if(e.button == 2){ //right click
     let angle = parseInt(document.getElementById("angle").value)*Math.PI/180;
        sources.push([x,y,Math.cos(angle)*_force,Math.sin(angle)*_force])
    
    }
    
        
    //dont know if i need these since i might just have a seperate thing
    ctx.restore()
    //draw(canvas,ctx)
    
}

function start(){
const canvas = document.getElementById('window');
ctx = canvas.getContext('2d');
canvas.style.backgroundColor = "white";
canvas.oncontextmenu = function (e) {
    e.preventDefault();
};
//event handling
const eventlistener = canvas.addEventListener("mousedown",function(e){
    mouseHandler(canvas,e,ctx) ;//pasing ctx and canvas for drawing
})

var viscSlider = document.getElementById("viscosity");
viscSlider.oninput = function() {
  j.vis = this.value*0.00001;
} 
var diffSlider = document.getElementById("diff");
diffSlider.oninput = function() {
  j.diff = this.value*0.00001;
} 
var diffSlider = document.getElementById("force");
diffSlider.oninput = function() {
  _force = this.value;
} 

var tickMs = 1000/30;
tickRate = 1/30;
setInterval(main,tickMs);

j =new Fluid(256,0.000001,1/30,0)
j.addDensity(64,64,10)
//j.addVelocity(1,64,1,100)

}



//Main
function main(){
    //j.addDensity(128,128,0.5)
    //j.addVelocity(128,128,1,0)
    j.step();
    for(let i=0;i<sources.length;i++){
        let source = sources[i]
        j.addVelocity(source[0],source[1],_force*source[2],_force*source[3])
        if(document.getElementById("dye").checked == true){
            j.addDensity(source[0],source[1],0.5)
        }
        
    }
    
    if(document.getElementById("view").checked == true){
        drawMagnitudeGrid(j.vx,j.vy)
    }
    else{
        drawGrid(j.density);
        }
}
function drawGrid(grid){
    //going to use tanh to decide between 0 and 1 since it maps the input. will add a scaler
    for(let i =0; i <grid.length;i++){
        for(let j =0; j <grid[i].length;j++){
           // console.log(grid[i][j])
       //Coloured fill style ctx.fillStyle = 'hsl(' + (1-Math.tanh(grid[i][j]*1000))*10000 + ',100%,' + 50 + '%)';
        ctx.fillStyle = 'hsl(' +0 + ',000%,' + (1-Math.tanh(grid[i][j]*10))*100+ '%)';
        ctx.fillRect(i*2,j*2,2,2);
        ctx.stroke();
        ctx.fill();
        
    }
        
        
    }
    
    
    
}
function drawMagnitudeGrid(grid1,grid2){
    for(let i =0; i <grid1.length;i++){
        for(let j =0; j <grid1[i].length;j++){
        ctx.fillStyle = 'hsl(' + (1-Math.tanh(grid1[i][j]*grid1[i][j]+grid2[i][j]*grid2[i][j]*30))*1000 + ',100%,' + 50 + '%)';
        ctx.fillRect(i*2,j*2,2,2);
        ctx.stroke();
        ctx.fill();
        
    }
        
        
    }
    
    
    
}





//Classes
class Fluid{
 constructor (size,viscosity,dt,diffusion){
     //using 2 seperate arrays for vx and vy as its easier to use and there probably a couple places where you can get divide by 0 errors when using vectors      console.log("works")
        this.size = size;
        this.vis = viscosity; //viscosity
        this.dt =dt; //time step
        this.diff = diffusion; // rate it diffuses / how quickly it diffuses
        this.s = [];
        //current,previous and map of density of dye
     //each grid is a vector field 
        this.vy = [];
        this.vx = [];
        this.vy0 = [];
        this.vx0 = [];
        this.density =[];
        //creating states;
        for(let i=0;i<size;i++){
            //curenct x and y directions
            this.vx.push(new Array(this.size).fill(0))
           // if(i>1) {this.vx[i-1][2] = -1}
            this.vy.push(new Array(this.size).fill(0))
            //previous x and y directions
            this.vx0.push(new Array(this.size).fill(0))
            this.vy0.push(new Array(this.size).fill(0))
            //density at apoint
            this.density.push(new Array(this.size).fill(0))
            this.s.push(new Array(this.size).fill(0));
        }
       // console.log("ddddf")
        console.log(this.vx.length)
        
        
    }
    //for adding a density of dye to a certain point in the fluid 
    addDensity(x,y,amount){
        this.density[x][y]+=amount;
    }
    addVelocity(x,y,amountX,amountY){
        //updating x and y components 
        this.vx[x][y]+=amountX;
        this.vy[x][y]+=amountY;
    }
    //this is the code that makes the stuff diffuse and handles the diffusion of its velocity
    diffuse(b,x,x0,diff,dt){
        let a = dt*diff*(this.size-2)*(this.size-2)
        this.linearSolve(b,x,x0,a,1+6*a)//uysually 1 +6*a
    }
    
    //solves for the next state
    linearSolve(b,x,x0,a,c){
        var cRecip = 1.0 / c;
        //console.log(x[0][2])
        for (let k = 0; k < iter; k++) {
                for (let j = 1; j < N - 1; j++) {
                    for (let i = 1; i < N - 1; i++) {
                        //the new value of a cell is based of the old value and all of its neighbours
                        x[i][j] =(x0[i][j] + a*(    x[i+1][j] +x[i-1][j] +x[i][j+1] +x[i][j-1])) * cRecip;
                    }
                }

            this.set_bnd(b, x, N);
        } 
    }
    
    project(velocX, velocY, p, div){
        for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
                div[i][j] = -0.5*(
                         velocX[i+1][j]
                        -velocX[i-1][j]
                        +velocY[i][j+1]
                        -velocY[i][j-1]
                    )/N;
                p[i][j] = 0;
            }
        }
    
        this.set_bnd(0, div); 
        this.set_bnd(0, p);
        this.linearSolve(0, p, div, 1, 6);
    
        for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
                velocX[i][j] -= 0.5 * (  p[i+1][j]
                                                -p[i-1][j]) * N;
                velocY[i][j] -= 0.5 * (  p[i][j+1]
                                                -p[i][j-1]) * N;
            }
        }
        this.set_bnd(1, velocX);
        this.set_bnd(2, velocY);
    }
    advect(b, d, d0, velocX, velocY, dt) {
      let i0, i1, j0, j1;

      let dtx = dt * (N - 2);
      let dty = dt * (N - 2);

      let s0, s1, t0, t1;
      let tmp1, tmp2, tmp3, x, y;

      let Nfloat = N-1;
      let ifloat, jfloat;
      let i, j, k;

      for (j = 1, jfloat = 1; j < N - 1; j++, jfloat++) {
        for (i = 1, ifloat = 1; i < N - 1; i++, ifloat++) {
          tmp1 = dtx * velocX[i][j];
          tmp2 = dty * velocY[i][j];
          x = ifloat - tmp1;
          y = jfloat - tmp2;

          if (x < 0.5) x = 0.5;
          if (x > Nfloat + 0.5) x = Nfloat + 0.5;
          i0 = Math.floor(x);
          i1 = i0 + 1.0;
          if (y < 0.5) y = 0.5;
          if (y > Nfloat + 0.5) y = Nfloat + 0.5;
          j0 = Math.floor(y);
          j1 = j0 + 1.0;

          s1 = x - i0;
          s0 = 1.0 - s1;
          t1 = y - j0;
          t0 = 1.0 - t1;


          let i0i = parseInt(i0);
          let i1i = parseInt(i1);
          let j0i = parseInt(j0);
          let j1i = parseInt(j1);
        if(i0i == 256)i0i=255;
        if(j0i == 256)j0i=255;
        if(i1i == 256)i1i=255;
        if(j1i == 256)j1i=255;    
            
            
        
      d[i][j] =
        s0 * (t0 * d0[i0i][j0i] + t1 * d0[i0i][j1i]) +
        s1 * (t0 * d0[i1i][j0i] + t1 * d0[i1i][j1i]);

            
        
        
        }
      }

      this.set_bnd(b, d);
    }
step() {
    let N = this.size;
    let visc = this.vis;
    let diff = this.diff;
    let dt = this.dt;
    let Vx = this.vx;
    let Vy = this.vy;
    let Vx0 = this.vx0;
    let Vy0 = this.vy0;
    let s = this.s;
    let density = this.density;
    //console.log("start",density[64][64])
    this.diffuse(1, Vx0, Vx, visc, dt);
    //console.log("after diffuse",density[64][64])
    this.diffuse(2, Vy0, Vy, visc, dt);

    this.project(Vx0, Vy0, Vx, Vy);
   //console.log("after project",Vx[0][0])
    this.advect(1, Vx, Vx0, Vx0, Vy0, dt);
    //console.log("after issue",Vx[0][0])
    this.advect(2, Vy, Vy0, Vx0, Vy0, dt);
//console.log("after issue 2",Vx[64][64])
    this.project(Vx, Vy, Vx0, Vy0);
    this.diffuse(0, s, density, diff, dt);
    //console.log("after issue 3",density[64][64])
    this.advect(0, density, s, Vx, Vy, dt);
   // console.log("after issue 4",density[64][64])
  }
 set_bnd(b, x) {
      let N = this.size;
          for (let i = 1; i < N - 1; i++) {
            x[i][0] = b == 2 ? -x[i][1] : x[i][1];
            x[i][N-1] = b == 2 ? -x[i][N-2] : x[i][N-2];
          }
          for (let j = 1; j < N - 1; j++) {
            x[0][j] = b == 1 ? -x[1][j] : x[1][j];
            x[N-1][j] = b == 1 ? -x[N-2][j] : x[N-2][j];
          }

          x[0][0] = 0.5 * (x[1][0] + x[0][1]);
          x[0][N-1] = 0.5 * (x[1][N-1] + x[0][N-2]);
          x[N-1][0] = 0.5 * (x[N-2][0] + x[N-1][1]);
          x[N-1][N-1] = 0.5 * (x[N-2][N-1] + x[N-1][N-2]);       
    }
}



//main code 
document.addEventListener('DOMContentLoaded', start) //just waits for everything to load first before it does anything c:
