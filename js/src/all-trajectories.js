
const allTrajectoriesPlotMargin = {top: 40, right: 20, bottom: 40, left: 100},
      allTrajectoriesPlotWidth = 400 - allTrajectoriesPlotMargin.left - allTrajectoriesPlotMargin.right,
      allTrajectoriesPlotHeight = 330 - allTrajectoriesPlotMargin.top - allTrajectoriesPlotMargin.bottom;

const colorCheme = ['#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#6a3d9a','#b15928'];

function createAllTrajectoriesMenu() {

    let allTrajectoriesContext;
    createAllPlots();

    function createAllPlots() {
        compartmentsOfSelectedNode.forEach(function (compartment) {
            d3.select("#menu-all-trajectories")
                .append("div")
                .attr("id", "trajectories-compartment-" + compartmentsOfSelectedNode.indexOf(compartment))
                .style("margin-left", "20px")
                .style("margin-top", "20px")
                .append("h2")
                .text(compartment);
        });

        for (let identifier in reducedNodeData) {
            let compartment = getCompartmentFromStringIdentifier(identifier);
            let species = getSpeciesFromStringIdentifier(identifier);
            let selector = "#trajectories-compartment-" + compartmentsOfSelectedNode.indexOf(compartment);

            prepareSinglePlot(selector, species, identifier);
        }
    }

    function prepareSinglePlot(selector, title, identifier) {

        allTrajectoriesContext = d3.select(selector)
            .append("svg")
            .attr("float", "left")
            .attr("width", allTrajectoriesPlotWidth + allTrajectoriesPlotMargin.left + allTrajectoriesPlotMargin.right +15)
            .attr("height", allTrajectoriesPlotHeight + allTrajectoriesPlotMargin.top + allTrajectoriesPlotMargin.bottom +15)
            .style("margin-bottom","20px")
            .style("margin-top", "20px")
            .append("g")
            .attr("transform","translate(" + allTrajectoriesPlotMargin.left + "," + allTrajectoriesPlotMargin.top  + ")");

        initializeAxisLabel();
        initializeTitle(title);
        addPlotData(identifier);


    }

    function initializeTitle(title) {
        allTrajectoriesContext.append("text")
            .attr("x", (allTrajectoriesPlotWidth / 2))
            .attr("y", 0 - (allTrajectoriesPlotMargin.top / 1.5))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(title);
    }

    function initializeAxisLabel() {
        allTrajectoriesContext.append("text")
            .attr("x", (allTrajectoriesPlotWidth / 2) + 20)
            .attr("y", allTrajectoriesPlotHeight + 50)
            // .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("font-size", "15px")
            .text("[ms]");

        allTrajectoriesContext.append("text")
            .attr("y", 0)
            .attr("x", 30)
            // .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("font-size", "15px")
            .text("[nmol/l]");
    }

    function addPlotData(identifier) {

        let xAxisScale = d3.scaleLinear()
            .domain(d3.extent(reducedNodeData[identifier], function (d) {
                return d.x;
            }))
            .range([0, allTrajectoriesPlotWidth]);

        let yAxisScale = d3.scaleLinear()
            .domain([0, d3.max(reducedNodeData[identifier], function (d) {
                return d.y;
            })])
            .range([allTrajectoriesPlotHeight, 0]);


        allTrajectoriesContext.append("g")
            .attr("transform", "translate(0," + (allTrajectoriesPlotHeight+15) + ")")
            .call(d3.axisBottom(xAxisScale).ticks(4));

        allTrajectoriesContext.append("g")
            .attr("transform", "translate(0," + 15 + ")")
            .call(d3.axisLeft(yAxisScale).ticks(5));

        allTrajectoriesContext
            .append("g")
            .attr("transform", "translate(0," + 15 + ")")
            .append("path")
            .datum(reducedNodeData[identifier])
            .style("stroke", colorCheme[getRandomInt(colorCheme.length-1)])
            .style("fill", "none")
            .attr("d", d3.line()
                .defined(function (d){
                   return d.y !== undefined
                })
                .x(function (d) {
                    return xAxisScale(d.x);
                })
                .y(function (d) {
                    return yAxisScale(d.y);
                }));
    }

    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

}