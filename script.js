/*
* Ref: 
*  https://www.d3indepth.com/transitions/
*  https://www.d3indepth.com/interaction/
*/

// Note: the array "data" contains the elements that define the locations and radii of the circles. 
// It can be defined in two ways: 
// Option 1: Array of coordinate arrays of type [x, y, r].
// Option 2: Array of objects of type {"id": 1, "x": 100, "y": 50, "r": 20}

"use strict";
const 
	option = 2,						// Choose data format: (1) = Array of coordinates / (2) = Array of objects.
	rMin = 2,							// Minimum radius available (could be any property, such as population, amount...)
	rMax = 28,						// Maximum radius available (could be any property, such as population, amount...)
	maxNumber = 20,				// Maximum number of circles in teh SVG container.
	proximity = 30,				// Proximity to circle center to enable coloring.
	hFactor = 0.8,				// Horizontal size factor (svg / body).
	vFactor = 0.8,				// Vertical size factor (svg / body).
	tranDelay = 1000,			// Default time delay (ms) during transitions (will be changed to "0" for dragging)
	tipWidth = '100px';		// Width of the tooltip box.

let data = [],					// Variable to store data from circles (position and radius).
	dragging = false,
	delay = tranDelay,		// Delay during transition.
	hoveredId,						// Variable to store id of the closest circle.
	width = window.innerWidth * hFactor, 		// Width of the SVG container.
	height = window.innerHeight * vFactor; 	// Height of the SVG container.

let box = d3.select('#box')			// Define the size of the svg container
	.style('width', width).style('height', height);

// ================================================
// Function to find top-left corner of an element.
// Ref: https://codepen.io/martinwantke/pen/rpNLWr
// ================================================
function getOffset(element) {
  const bound = element.getBoundingClientRect();
  const html = document.documentElement;
  return {
    top: bound.top + window.pageYOffset - html.clientTop,
    left: bound.left + window.pageXOffset - html.clientLeft
  };
}

// ================================================
// Re-define size of the container if the windown is resized
// ================================================
window.addEventListener("resize", rewindow);

function rewindow(){
	width = window.innerWidth * hFactor; 			// Width of the SVG container.
	height = window.innerHeight * vFactor; 		// Height of the SVG container.
	box.style('width', width).style('height', height);
}


// ================================================
// Define and update the quadtree
// ================================================
let quadtree = d3.quadtree(); 	// Define the quadtree 
if (option == 2) quadtree.x(d => d.x).y(d => d.y);	// req'd for option (2) only.

function updateQuadtree() {	
	quadtree.removeAll(quadtree.data());		// Start from empty quadtree.
	quadtree.addAll(data);									// Create quadtree with all tne new data.
}

// ================================================
// Enable user interaction within "box".
// ================================================
function initEvents() { 
	box.on('mousemove', handleMousemove); 	// When mouse moves within 'box', run handleMousemove;
	box.selectAll('circle').call(drag);			// When we drag a circle, use the D3.drag procedure.
}

// ================================================
// Function to update data (circles: number, x, y, r).
// Two options depending on how the data array is configured:
// ================================================
function updateData() {
	data = [];																	// Start from empty data array.
	let numPoints = Math.random() * maxNumber;	// Update number of items.
	
	for(let i=0; i<numPoints; i++) {						
		if (option == 1) 				// Option (1): arrays of type [x, y, r]. quadtree uses positions [0] & [1] for coordinates x & y
			data.push( [											// Add items to the data array.
				Math.random() * width, 					// data[i][0] is "x" coordinate within container (req'd for quadtree).
				Math.random() * height, 				// data[i][1] is "y" coordinate within container (req'd for quadtree).
				rMin + Math.random() * rMax 		// data[i][2] is radius (mi.
			] );		
		else if (option == 2)		// Option (2): objects of type {id, x, y, r}. quadtree defines x y with item properties .x .y			
			data.push( {											// Add items to the data array.
				id: i,													// id of each circle.
				x: Math.random() * width,				// "x" property is the "x" coordinate.
				y: Math.random() * height,			// "y" property is the "y" coordinate.
				r: rMin + Math.random() * rMax	// "r" property is the "r" coordinate.
			} );	 
	}
}

// ================================================
// Handle color and tooltip for each circle.
// ================================================
function handleMousemove(e) {
	const 
		pos = d3.pointer(e, this),													// Define cursor position [x, y] using D3.pointer.
	 	item = quadtree.find(pos[0], pos[1], proximity); 		// Find the closest element within proximity limit.

	updateTooltip(item);																	// Refresh the tooltip.
	updateCircles();																			// Refresh the circles to change color.
}

// ================================================
// Handle drag & drop.
// ================================================
let drag = d3.drag().on('drag', handleDrag);

function handleDrag(e) {
	const item = quadtree.find(e.x, e.y, proximity); 		// Find the closest element within proximity limit.	

	e.subject.x = e.x;					// Assign the new 'x' coordinate to the dragged element
	e.subject.y = e.y;					// Assign the new 'y' coordinate to the dragged element

	updateQuadtree();						// Update quadtree with the new position of the circle.
	updateTooltip(item);				// Update the tooltip in the new position of the circle.
	delay = 0;									// Cancel transition delay time during drag & drop.
	updateCircles();						// Refresh the circles (position and color).
	delay = tranDelay;					// Return to normal transition delay value.
}

// ================================================
// Function to update tooltip when applicable 
// ================================================
function updateTooltip(item) {
  const tooltip = d3.select('.tooltip').style('width', tipWidth);	// Define the tooltip element and its width.
	
	hoveredId = item ? data.indexOf(item) : undefined;		// Index of closest circle (array of coordinates).
  if (hoveredId === undefined) {												// Hide tooltip if cursor is not close to any circle.
    tooltip.style('opacity', 0);
  } 
	else {																								// Show tooltip for the chosen circle.
    const 
			element = document.getElementById('box'),					// Define the svg box as "element".
     	offset = getOffset(element),											// Get the top and left offset of the svg box.
     	xTip = option == 1 ? item[0] : item.x,						// Define 'x' coordinate of the tooltip.
     	yTip = option == 1 ? item[1] : item.y,						// Define 'y' coordinate of the tooltip.
		// Define text to be shown in tooltip.		
			tipText = `id: ${hoveredId}; r = ${item.r.toFixed(2)}<br>pos: [ ${item.x.toFixed(0)}, ${item.y.toFixed(0)}]`;		
    tooltip																							// Define the tooltip.
      .style('opacity', 0.8)														// Show it (opacity > 0).
      .style('left', xTip + offset.left + 'px')					// Assign 'x' coordinate.
      .style('top', yTip + offset.top + 'px')						// Assign 'y' coordinate.
			.html(tipText);																		// Update the text.
  }
}

// ================================================
// Function to update number, size and color of circles
// ================================================
function updateCircles() {
	box.selectAll('circle')
		.data(data)
		.join(
			function(enter) {																	// define how new "entering" elements appear.
				return enter
					.append('circle')															// append a circle for each element in "data".
					.attr('cy', d => option == 1 ? d[1] : d.y );	// Initial "y" coordinate for transition (x and r are 0 by default). 
			},
			function(update) { return update; },				// define what happens to existing elements.
			function(exit) { 														// Define how "exiting" elements disappear.
				return exit													
					.transition().duration(delay)			
					.attr('cx', width)											// Take elements to rightmost "x" coordinate.
					.attr('r', 0)														// Decrease radius to minimum.
					.remove();															// Finally disappear.
			}
		)
		.style('fill', (d, i) => (i === hoveredId ? 'red' : null)) // Circle color (immediate, not transition)
		.transition().duration(delay)									// Define transition from initial to static for following operations.
		.attr('cx', d => option == 1 ? d[0] : d.x )		// x coordinate (from array or from object)
		.attr('cy', d => option == 1 ? d[1] : d.y )		// y coordinate (from array or from object)
		.attr('r', d => option == 1 ? d[2] : d.r );		// radius (from array or from object)
}

// ================================================
// Function executed by "refresh" button
// ================================================
function refresh() { 			
	updateData();				// Update array of data
	updateQuadtree();		// Update the quadtree
	updateCircles();		// Update the circles	
	initEvents();				// handle the mouse when hovering over the svg window
}

refresh();