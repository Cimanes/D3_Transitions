/*
* Ref: 
*  https://www.d3indepth.com/transitions/
*  https://www.d3indepth.com/interaction/
*  https://codepen.io/martinwantke/pen/rpNLWr
*/

// Note: the array "data" contains the elements that define the locations and radii of the circles. 
// It can be defined in two ways: 
// Option 1: Array of coordinate arrays of type [x, y, r].
// Option 2: Array of objects of type {"id": 1, "x": 100, "y": 50, "r": 20}

"use strict";
const 
	option = 2,				// Choose data format: (1) = Array of coordinates / (2) = Array of objects.
	radius = 28,			// Maximum radius available (could be any property, such as population, amount...)
	maxNumber = 20,		// Maximum number of circles in teh SVG container.
	proximity = 30,		// Proximity to circle center to enable coloring.
	delay = 1000,			// Delay during transition.
	hFactor = 0.8,		// Horizontal size factor (svg / body).
	vFactor = 0.8,		// Vertical size factor (svg / body).
	tipWidth = '50px';// Width of the tooltip box.

let data = [],			// Variable to store data from circles (position and radius).
 	hoveredId,				// Variable to store id of the closest circle.
	width = window.innerWidth * hFactor, 		// Width of the SVG container.
	height = window.innerHeight * vFactor; 	// Height of the SVG container.

// Define the size of the svg container
let box = d3.select('#box').style('width', width).style('height', height);

// ================================================
// Re-define size of the container if the windown is resized
// ================================================
function rewindow(){
	width = window.innerWidth * hFactor; 			// Width of the SVG container.
	height = window.innerHeight * vFactor; 		// Height of the SVG container.
	box.style('width', width).style('height', height);
}
window.addEventListener("resize", rewindow);

// ================================================
// Define the quadtree 
// ================================================
let quadtree = d3.quadtree(); 
if (option == 2) quadtree.x(d => d.x).y(d => d.y);	// req'd for option (2) only.

// ================================================
// Function to update circles (number, x, y, r).
// Two options depending on how the data array is configured:
// ================================================
function updateData() {
	data = [];																	// Start from empty data array.
	let numPoints = Math.random() * maxNumber;	// Update number of items.
	
	for(let i=0; i<numPoints; i++) {						
		
		if (option == 1) 					// Option (1): arrays of type [x, y, r]. quadtree uses positions [0] & [1] for coordinates x & y
			data.push( [
				Math.random() * width, 			// data[i][0] is "x" coordinate within container (req'd for quadtree).
				Math.random() * height, 		// data[i][1] is "y" coordinate within container (req'd for quadtree).
				2 + Math.random() * radius 	// data[i][2] is radius.
			] );
		
		else if (option == 2)			// Option (2): objects of type {id, x, y, r}. quadtree defines x y with item properties .x .y			
			data.push( {										// Add items to the data array.
				id: i,												// id of each circle.
				x: Math.random() * width,			// "x" property is the "x" coordinate.
				y: Math.random() * height,		// "y" property is the "y" coordinate.
				r: 2 + Math.random() * radius	// "r" property is the "r" coordinate.
			} );	 
	}
}

// ================================================
// Function to find top-left corner of an element.
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
// Handle color for each circle and tooltip.
// ================================================
function handleMousemove(e) {
	const 
	 	pos = d3.pointer(e, this),													// Define cursor position [x, y].
 		item = quadtree.find(pos[0], pos[1], proximity); 		// Find the closest element within proximity limit.
		updateTooltip(item);
		updateCircles();																		// update the circles to change color if required.
}

// ================================================
// Enable color changing when moving mouse within "box".
// ================================================
function initEvents() { box.on('mousemove', handleMousemove); }

// ================================================
// Function to update quadtree
// ================================================
function updateQuadtree() {	
	quadtree.removeAll(quadtree.data());		// Start from empty quadtree.
	quadtree.addAll(data);									// Create quadtree with all tne new data.
}

// ================================================
// Function to update tooltip when applicable 
// ================================================
function updateTooltip(item) {
  const 
		tooltip = d3.select('.tooltip'),
		element = document.getElementById('box'),						// Define the svg box as "element"
		offset = getOffset(element);												// Get the top and left offset of the svg box
	
	hoveredId = item ? data.indexOf(item) : undefined;		// Index of closest circle (array of coordinates).
  if (hoveredId === undefined) {
    tooltip.style('opacity', 0);
  } else {
    const tipText = `id: ${hoveredId}<br>r = ${item.r.toFixed(2)}`;
    const offset = getOffset(element);
    const xTip = option == 1 ? item[0] : item.x;
    const yTip = option == 1 ? item[1] : item.y;

    tooltip
      .style('opacity', 0.8)
      .style('width', tipWidth)
      .html(tipText)
      .style('left', xTip + offset.left + 'px')
      .style('top', yTip + offset.top + 'px');
  }
}

// ================================================
// Function to update number, size and color of circles
// ================================================
function updateCircles() {
	box.selectAll('circle')
		.data(data)
		.join(
			function(enter) {														// define how new "entering" elements appear.
				return enter
					.append('circle')												// append a circle for each element in "data".
					.attr('cy', d => option == 1 ? d[1] : d.y );		// Initial "y" coordinate for transition (x and r are 0 by default). 
					// .style('fill', (d, i) => (i === hoveredId ? 'red' : null));
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
	// console.log(data);
}
refresh();