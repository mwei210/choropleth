import * as d3 from 'd3';
import * as topojson from 'topojson';

var margin = { top: 0, left: 0, right: 0, bottom: 0 },
  height = 720 - margin.top - margin.bottom,
  width = 1280 - margin.left - margin.right;

var svg = d3.select("#map").append("svg")
            .attr("height", height + margin.top + margin.bottom)
            .attr("width", width + margin.left + margin.right);

var tooltip = d3.select("#map").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

tooltip.append("div")
       .attr("class", "label");

tooltip.append("div")
       .attr("class", "count");

var g = svg.append("g")
           .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var projection = d3.geoAlbersUsa()
                   .translate([ width / 2, height / 2 ])
                   .scale(1280);

var path = d3.geoPath()
             .projection(projection);

var color = d3.scaleThreshold()
              .domain([15000, 19000, 23000, 27000, 31000, 35000])
              .range(
                ["#E183A8",
                "#D88BB9",
                "#CA94C8",
                "#B89ED5",
                "#A3A8DD",
                "#8BB1E2",
                "#71BAE2"]);

// var legendSize = 18;
// var legendSpace = 4;
//
// var legend = svg.selectAll(".legend")
//                 .data(color.domain())
//                 .enter().append("g")
//                 .attr("class", "legend")
//                 .attr("transform", (d, i) => {
//                   var height = legendSize + legendSpace;
//                   var offset = height * color.domain().length / 2;
//                   var x = -2 * legendSize;
//                   var y = i * height - offset;
//                   return 'translate(' + x + ',' + y + ')';
//                 });
//
// legend.append("rect")
//       .attr("width", legendSize)
//       .attr("height", legendSize)
//       .style("fill", color)
//       .style("stroke", color);
//
// legend.append("text")
//       .attr("x", legendSize + legendSpace)
//       .attr("y", legendSize - legendSpace)
//       .text(d => d)

d3.queue()
  .defer(d3.json, "build/gz_2010_us_050_00_20m.json")
  .defer(d3.csv, "data/ACS_15_5YR_S1902_with_ann.csv")
  .await(ready);

var scale = d3.scaleLinear()
              .domain([0, 60000])
              .range([0, 240]);

var axis = d3.axisBottom(scale)
             .tickSize(12)
             .tickValues(color.domain());

var g = d3.select("g").call(axis);

g.select(".domain").remove();

g.selectAll("rect")
  .data(color.range().map(c => {
    var d = color.invertExtent(c);
    if (d[0] == null) d[0] = scale.domain()[0];
    if (d[1] == null) d[1] = scale.domain()[1];
    return d;
  }))
  .enter()
  .insert("rect", ".tick")
  .attr("height", 8)
  .attr("scale", d => scale(d[0]))
  .attr("width", d => scale(d[1]) - scale(d[0]))
  .attr("fill", d => color(d[0]));

g.append("text")
  .attr("fill", "#000")
  .attr("font-weight", "bold")
  .attr("text-anchor", "start")
  .attr("y", -6)
  .text("Per capita income in US dollars");

function ready(error, us, income) {
  if (error) throw error;

  var incomeByCounty = {};
  income.forEach(d => {
    // console.log(d);
    const income = d["Mean income (dollars); Estimate; PER CAPITA INCOME BY RACE AND HISPANIC OR LATINO ORIGIN - Total population"]
    incomeByCounty[d.Id2] = +income;
  });

  var nameByCounty = {};
  income.forEach(d => {
    // console.log(d);
    const name = d.Geography;
    nameByCounty[d.Id2] = name;
  });

  // console.log(incomeByCounty);

  // console.log(us);

  g.selectAll("path")
    .attr("class", "county")
      .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
      .attr("d", path)
      .style("fill", d => {
        // console.log(d);
        const adjId = d.id < 10000 ? ("0" + d.id) : d.id;
        return color(incomeByCounty[adjId]);
      })
      .style("opacity", 0.75)
      .on("mouseover", function(d) {
        d3.select(this)
          .transition()
          .duration(250)
          .ease(d3.easeLinear)
          .style("opacity", 1);
        tooltip.transition().duration(250)
               .style("opacity", 1);
        const adjId = d.id < 10000 ? ("0" + d.id) : d.id;
        if (nameByCounty[adjId]) {
          console.log(incomeByCounty[adjId]);
          tooltip.select(".label").html(`${nameByCounty[adjId]}: `);
          tooltip.select(".count").html(`$${incomeByCounty[adjId]}`);
        }
        else {
          tooltip.select(".label").html("Data not available");
          tooltip.select(".count").html("");
        }
        tooltip.style("display", "block");
        d3.select(this).attr("class", "county hover");
      })
      .on("mouseout", function(d) {
        d3.select(this)
          .transition()
          .duration(250)
          .ease(d3.easeLinear)
          .style("opacity", 0.75);
        tooltip.transition().duration(250)
               .style("opacity", 0);
      })
      .on("mousemove", d => {
        tooltip.style("top", (d3.event.layerY + 5) + "px")
               .style("left", (d3.event.layerX + 20) + "px");
      });

  g.append("path")
     .datum(topojson.mesh(us, us.objects.states, (a, b) => (a !== b)))
     .attr("class", "state")
     .attr("d", path);
}
