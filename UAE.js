const margin = { top: 70, right: 30, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const x = d3.scaleTime()
  .range([0, width]);

const y = d3.scaleLinear()
  .range([height, 0]);

const line = d3.line()
  .x(d => x(d.date))
  .y(d => y(d.rent));

const svg = d3.select("#chart-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

d3.csv("UAE_data.csv").then(data => {
  const parseDate = d3.timeParse("%m/%d/%Y");
  data.forEach(d => {
    d.date = parseDate(d.date);
    d.rent = +d.rent;
  });

  x.domain(d3.extent(data, d => d.date));
  y.domain([0, d3.max(data, d => d.rent)]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .style("font-size", "15px")
    .call(d3.axisBottom(x)
      .tickValues(x.ticks(d3.timeMonth.every(2)))
      .tickFormat(d3.timeFormat("%b %Y")))

  svg.append("g")
    .style("font-size", "12px")
    .call(d3.axisLeft(y)
      .ticks((d3.max(data, d => d.rent) - 65000) / 500000)
      .tickFormat(d => {
        if (isNaN(d)) return "";
        return `${(d / 1000000).toFixed(0)} million`;
      })
      .tickPadding(1))

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Rent in AED (0.27USD)");

  const path = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 1)
    .attr("d", line);

  const circle = svg.append("circle")
    .attr("r", 0)
    .attr("fill", "red")
    .style("stroke", "black")
    .style("pointer-events", "none");

  const listeningRect = svg.append("rect")
    .attr("width", width)
    .attr("height", height);

  listeningRect.on("mousemove", function (event) {
    const [xCoord] = d3.pointer(event, this);
    const bisectDate = d3.bisector(d => d.date).left;
    const x0 = x.invert(xCoord);
    const i = bisectDate(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    const xPos = x(d.date);
    const yPos = y(d.rent);

    circle.attr("cx", xPos)
      .attr("cy", yPos);

    circle.transition()
      .duration(50)
      .attr("r", 2);

    tooltip
      .style("display", "block")
      .style("left", `${xPos + 25}px`)
      .style("top", `${yPos + 10}px`)
      .html(`<strong>Date:</strong> ${d.date.toLocaleDateString()}<br><strong>rent:</strong> ${d.rent !== undefined ? (d.rent).toFixed(0) + ' AED' : 'N/A'}`)
  });

  listeningRect.on("mouseleave", function () {
    circle.transition()
      .duration(50)
      .attr("r", 0);

    tooltip.style("display", "none");
  });

  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", margin.left + 180)
    .attr("y", margin.top - 100)
    .style("font-size", "30px")
    .text("Cost of Yearly Rent in the UAE since January 2023");

});
