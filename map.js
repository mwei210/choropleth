import * as d3 from 'd3';
import * as topojson from 'topojson';

var margin = { top: 0, left: 0, right: 0, bottom: 0 },
  height = 600 - margin.top - margin.bottom,
  width = 1200 - margin.left - margin.right;

var svg = d3.select("#map").append("svg")
            .attr("height", height + margin.top + margin.bottom)
            .attr("width", width + margin.left + margin.right);

var g = svg.append("g")
           .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.queue()
  .defer(d3.json, "data/counties.json")
  .defer(d3.csv, "data/ACS_15_5YR_S1902_with_ann.csv")
  .await(ready);

var projection = d3.geoAlbersUsa()
                   .translate([ width / 2, height / 2 ])
                   .scale(1000);

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

function ready(error, us, income) {
  if (error) throw error;

  var incomeByCounty = {};
  income.forEach(d => {
    console.log(d.Geography);
    const income = d["Mean income (dollars); Estimate; PER CAPITA INCOME BY RACE AND HISPANIC OR LATINO ORIGIN - Total population"]
    incomeByCounty[d.Id2] = +income;
  });

  console.log(incomeByCounty);

  console.log(us);

  svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.us).features)
    .enter().append("path")
      .attr("d", path)
      .style("fill", d => (color(incomeByCounty[d.properties.GEOID])));
}