import * as d3 from 'd3';
import * as topojson from 'topojson';

var margin = { top: 0, left: 0, right: 0, bottom: 0 },
  height = 768 - margin.top - margin.bottom,
  width = 1366 - margin.left - margin.right;

var svg = d3.select(".map").append("svg")
            .attr("height", height + margin.top + margin.bottom)
            .attr("width", width + margin.left + margin.right)
            .style("display", "block")
            .style("margin", "15px auto");

var projection = d3.geoAlbersUsa()
                   .translate([ width / 2, height / 2 ])
                   .scale(1366);

var path = d3.geoPath()
             .projection(projection);

var tooltip = d3.select(".map").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

tooltip.append("div")
       .attr("class", "name");

tooltip.append("div")
       .attr("class", "income");

var g = svg.append("g")
           .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

var legend_values = [
  "< 15000",
  "15000+",
  "19000+",
  "23000+",
  "27000+",
  "31000+",
  "$35000+"
]

d3.queue()
  .defer(d3.json, "build/gz_2010_us_050_00_20m.json")
  .defer(d3.csv, "data/ACS_15_5YR_S1902_with_ann.csv")
  .await(ready);

function ready(error, us, income) {
  if (error) throw error;

  var incomeByCounty = {};
  income.forEach(d => {
    const meanIncome = d["Mean income (dollars); Estimate; PER CAPITA INCOME BY RACE AND HISPANIC OR LATINO ORIGIN - Total population"]
    incomeByCounty[d.Id2] = +meanIncome;
  });

  var nameByCounty = {};
  income.forEach(d => {
    const name = d.Geography;
    nameByCounty[d.Id2] = name;
  });

  g.selectAll("path")
    .attr("class", "counties")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
      .attr("d", path)
      .style("fill", d => {
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
          tooltip.select(".name").html(`${nameByCounty[adjId]}: `);
          tooltip.select(".income").html(`$${incomeByCounty[adjId]}`);
        }
        else {
          tooltip.select(".name").html("Data not available");
          tooltip.select(".income").html("");
        }
        tooltip.style("display", "block");
      })
      .on("mouseover", function(d) {
        d3.select(this)
          .transition()
          .duration(250)
          .ease(d3.easeLinear)
          .style("opacity", 1)
      })
      .on("mouseout", function(d) {
        d3.select(this)
          .transition()
          .duration(250)
          .ease(d3.easeLinear)
          .style("opacity", 0.75)
      });

  g.append("g")
    .attr("class", "states")
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
    .attr("d", path)

  g.append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => (a !== b)))
    .attr("class", "mesh")
    .attr("d", path);

  var legend = svg.selectAll("g.legend")
                  .data([0, 15000, 19000, 23000, 27000, 31000, 35000])
                  .enter().append("g")
                  .attr("class", "legend");

  var legend_width = 35, legend_height = 20;

  legend.append("rect")
        .attr("width", legend_width)
        .attr("height", legend_height)
        .attr("class", "legend disabled")
        .attr("x", 20)
        .attr("y", (d, i) => (height - ((i + 8) * legend_height)))
        .style("fill", (d, i) => color(d))
        .style("opacity", 0.75)


  legend.append("text")
        .attr("x", 70)
        .attr("y", (d, i) => (height - ((i + 7) * legend_height) - 5))
        .text((d, i) => legend_values[i]);
}
