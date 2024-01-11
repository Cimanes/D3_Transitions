const width = 600, 	// Width of the SVG container.
	height = 300, 		// Height of the SVG container.
	radius = 30,			// Maximum radius available.
	maxNumber = 30,		// Maximum number of circles in teh SVG container.
	proximity = 30,		// Proximity to circle center to enable coloring.
	delay = 1000;			// Delay during transition.
		
let data = [];			// Variable to store data from circles.
let arrRad = [];		// variable to store radii of circles (only used when data is an array of coordinate arrays)
let hoveredId;			// Variable to store id of the closest circle.

// Define an SVG container within the divand define its size.
const box = d3.select('svg').style('width', width).style('height', height);

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

// Define the quadtree 
// Two options depending on how the data array is configured:

// (1) When data is an array of coordinates with elements [x, y...]:
// let quadtree = d3.quadtree(); 

// (2) When data array is made of objects with "x" and "y" properties:
let quadtree = d3.quadtree()
		.x( d => d.x )
		.y( d => d.y );

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

// Function to update circles (number, x, y, r).
// Two options depending on how the data array is configured:

// option (1) When data array is made of objects with "x" and "y" properties:
// ---------------------------------------------------------------------------------
function updateData() {												
	 data = [];																	// Start from empty data array.
	 let numPoints = Math.random() * maxNumber;	// Update number of items.
	 
	 // add elements of type [100, 200, 20] ([x, y, r]: quadtree needs x-y coordinates to use positions "0-1")
	 for(let i=0; i<numPoints; i++) {						
		 data.push( [
				Math.random() * width, 			// data[i][0] is "x" coordinate within container (req'd for quadtree).
				Math.random() * height, 		// data[i][1] is "y" coordinate within container (req'd for quadtree).
				Math.random() * radius 			// data[i][2] is radius.
			] );
	 }
}

// option (2) When data array is made of objects with "x" and "y" properties:
// ---------------------------------------------------------------------------------
function updateData() {												
	data = [];																	// Start from empty data array.
	let numPoints = Math.random() * maxNumber;	// Define number of items.

	for(let i=0; i<numPoints; i++) {	// Add objects of type {'id: 1, 'x': 100, 'y': 200, 'r': 20}
		data.push( {										// Add items to the data array.
			id: i,												// id of each circle.
			x: Math.random() * width,			// x coordinate within the svg window.
			y: Math.random() * height,		// y coordinate within the svg window.
			r: Math.random() * radius			// r between 1 and 30.
		} );
	}
}

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

// Function to find pointer and decide color for each circle.
function handleMousemove(e) {
	let pos = d3.pointer(e, this);											// cursor position [x, y].
	let i = quadtree.find(pos[0], pos[1], proximity); 	// closest element within proximity limit.
	hoveredId = i ? i : undefined;											// option (1) find index of closest circle (array of coordinates).
	// hoveredId = i ? i.id : undefined;								// option (2) find index of closest circle (array of objects).
 	updateCircles();																		// update the circles to change color if required.
}

// Enable color changing when moving mouse within "box".
function initEvents() { box.on('mousemove', handleMousemove); }

function updateQuadtree() {	
	quadtree.removeAll(quadtree.data());		// Start from empty quadtree.
	quadtree.addAll(data);									// Create quadtree with all tne new data.
}

function updateCircles() {
	box.selectAll('circle')
		.data(data)
		.join(
			function(enter) {											// define how new "entering" elements appear.
				return enter.append('circle')				// append a circle for each element in "data".
					.attr('r', 0)											// initial radius for the transition (start with minimum circle).
					.attr('cx', 0)										// initial "x" coordinate for the transition (come from the left of the container).
					.attr('cy', d => d.y )						// initial "y" coordinate for transition. option (2) data array from array of objects.
					// .attr('cy', d => d[1] )				// initial "y" coordinate for transition. option (1) data array from array of coordinates.
				},
			function(update) { return update; },	// define what happens to existing elements.
			function(exit) { 											// Define how "exiting" elements disappear.
				return exit													
					.transition().duration(delay)			
					.attr('cx', 600)									// Take elements to rightmost "x" coordinate.
					.attr('r', 0)											// Decrease radius to minimum.
					.remove();												// Finally disappear.
			}
		)
		.style('fill', function(d, i) { return data[i] === hoveredId ? 'red' : '#fff';})
		.transition().duration(delay)					// Define transition from initial (enter) to static.
		.attr('cx', d => d.x )								// option (2) x coordinate for data from array with objects.		
		.attr('cy', d => d.y )								// option (2) y coordinate for data from array with objects.
		.attr('r', d => d.r );								// option (2) radius for data from array with objects.
		// .attr('cx', d => d[0] )						// option (1) x coordinate: data from array of coordinates.
		// .attr('cy', d => d[1] )						// option (1) y coordinate: data from array of coordinates.
		// .attr('r', d => d[2] );						// option (1) radius: data from array of coordinates.
}

// ---------------------------------------------------------------------------------

function refresh(){ 
	updateData();	
	updateQuadtree();
	updateCircles();		
	initEvents();
}

refresh();