import * as d3 from 'd3';
import * as topojson from 'topojson';

var margin = { top: 0, left: 0, right: 0, bottom: 0 },
  height = 600 - margin.top - margin.bottom,
  width = 1200 - margin.left - margin.right;

var svg = d3.select("#map")
            .append("svg")
            .attr("height", height + margin.top + margin.bottom)
            .attr("width", width + margin.left + margin.right);

var g = svg.append("g")
           .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.queue()
  .defer(d3.json, "data/us.json")
  .await(ready);

var projection = d3.geoAlbersUsa()
                   .translate([ width / 2, height / 2 ])
                   .scale(1000);

var path = d3.geoPath()
             .projection(projection);


function ready(error, us) {
  if (error) throw error;
  g.selectAll("path")
   .data(us.features)
   .enter().append("path")
   .attr("fill", "#ccc")
   .attr("d", path);
}
