var units = "% of Fuel Supply in 2020-2021";

// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// format variables
var formatNumber = d3.format(",.1f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + units; },

// Define two colour palletes, one for states and one for fuel types
// color = d3.scaleOrdinal()
//                   .domain(['Biomass', 'Black coal', 'Liquid Fuel', 'Gas', 'Battery', 'Wind', 'Hydro', 'Brown coal'])
//                   .range(['#66a61e', '#666666', '#757ob3', '']);

color = d3.scaleOrdinal(d3.schemeCategory20)
                  .domain(['Biomass', 'Black coal', 'Liquid Fuel', 'Gas', 'Battery', 'Wind', 'Hydro', 'Brown coal'])
                  .range(["#99C24D", "#232020", "#553739", "#BB4430", "#E7BB41", "#8963BA", "#7EBDC2", "#DDA15E"]);

var states = ['QLD', 'NSW', 'VIC', 'TAS', 'SA'];
color_states = d3.scaleOrdinal()
                  .domain(states)
                  .range(["#ED8624", "#4C78A8", "#E45756", "#94C9A9", "#C6ECAE"]);

// append the svg object to the body of the page
var svg = d3.select("#fuel_sankey").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// Set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([width, height])
    .layout(0);

var path = sankey.link();

// load the data
d3.csv("./sankey/sankey_data.csv", function(error, data) {
 
  //set up graph in same style as original example but empty
  graph = {"nodes" : [], "links" : []};

  data.forEach(function (d) {
    graph.nodes.push({ "name": d.source });
    graph.nodes.push({ "name": d.target });
    graph.links.push({ "source": d.source,
                       "target": d.target,
                       "value": +d.value });
   });

  // return only the distinct / unique nodes
  graph.nodes = d3.keys(d3.nest()
    .key(function (d) { return d.name; })
    .object(graph.nodes));

  // loop through each link replacing the text with its index from node
  graph.links.forEach(function (d, i) {
    graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
    graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
  });

  // now loop through each nodes to make nodes an array of objects
  // rather than an array of strings
  graph.nodes.forEach(function (d, i) {
    graph.nodes[i] = { "name": d };
  });

  sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);

  // add in the links
  var link = svg.append("g").selectAll(".link")
      .data(graph.links)
      .enter().append("path")
      .attr("class", "link")
      .style("stroke-opacity", "0.5")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

  // add the link titles
  link.append("title")
        .text(function(d) {
    		return d.source.name + " → " + 
                d.target.name + "\n" + format(d.value); });

  // add in the nodes
  var node = svg.append("g").selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
		  return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.drag()
        .subject(function(d) {
          return d;
        })
        .on("start", function() {
          this.parentNode.appendChild(this);
        })
        .on("drag", dragmove));

  // add the rectangles for the nodes
  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { 
        // If the "node" is a state, then use the states pallete
        if (states.includes(d.name)) {
          return d.color = color_states(d.name); 
        } else {
          return d.color = color(d.name);
        }
      })
      .style("stroke", function(d) { 
        return d3.rgb(d.color).darker(2); 
      })
      .append("title")
      .text(function(d) { 
        return d.name + "\n" + format(d.value); 
      });

  // add in the title for the nodes
  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 10 + sankey.nodeWidth())
      .attr("text-anchor", "start");

  // the function for moving the nodes
  function dragmove(d) {
    d3.select(this)
      .attr("transform", 
            "translate(" 
               + d.x + "," 
               + (d.y = Math.max(
                  0, Math.min(height - d.dy, d3.event.y))
                 ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }

  // Finally colour links
  svg.selectAll(".link")
    .style('stroke', function(d) { return d.source.color; })
    .on("mouseover", function() { d3.select(this).style("stroke-opacity", "0.7") } )
    .on("mouseout", function() { d3.select(this).style("stroke-opacity", "0.5") } )
});