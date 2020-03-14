**Fluid Dynamics Simulation
An implementation of the navier stokes equations in JS based on https://www.mikeash.com/pyblog/fluid-simulation-for-dummies.html
You can click on the screen to add dye and switch between modes to the magnitude of the velocities of each "particle"
It works by breaking the screen down into 256*256 blocks. and each block has an x and y velocity.
You can togle the rate of diffusion and the viscosity of the liquid.
Clicking on the screen gives a random velocity and adds some dye to that point on the screen


The colouring is done by using HSL and changing the hue and using TanH

By leo Harford 2020
