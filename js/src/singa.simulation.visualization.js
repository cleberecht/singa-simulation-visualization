//Global variables

const modalMargin = {top: 40, right: 20, bottom: 40, left: 100},
    modalWidth = 400 - modalMargin.left - modalMargin.right,
    modalHeight = 300 - modalMargin.top - modalMargin.bottom;

const margin = {top: 40, right: 25, bottom: 40, left: 25},
    width = parseInt(d3.select(".trajectory").style("width")) - margin.left - margin.right,
    height = parseInt(d3.select(".trajectory").style("height")) - margin.top - margin.bottom;

const heatMargin = {top: 30, right: 30, bottom: 30, left: 30},
    heatwidth = 450 - heatMargin.left - heatMargin.right,
    heatheight = 450 - heatMargin.top - heatMargin.bottom;

const color = ['#d95f02', '#7570b3', '#e7298a'];


const x = d3.scaleLinear().range([0, width]);
let y0 = d3.scaleLinear().range([height, 0]),
    y1 = d3.scaleLinear().range([height, 0]),
    y2 = d3.scaleLinear().range([height, 0]);

let summedData = [],
    summedNodeData = [],
    activeTrajectories = [],
    time = [],
    globalNode,
    compartments = [],
    allCompartments = [],
    allSpecies = [],
    allNodes = [],
    timeUnit = null,
    concentrationUnit = null,
    reader = new FileReader(),
    globalData = null,
    valueline1 = d3.line(),
    svgMain,
    modalSvg,
    heatmapSvg,
    heatmapY,
    heatmapX,
    currentTime,
    currentCompartment,
    currentNode,
    parent,
    summedY = [],
    highlightedSpecies = [],
    globalSearchIterator,
    searchButtonDataArray = [],
    heatmapData = [],
    sliderSimple,
    gSimple,
    heatmapXRange = [],
    heatmapYRange = [];

let regEx = new RegExp("\\((\\d+), (\\d+)\\)", "g");


//Functions to read and structure the data into a uniform data format (nestedData)


$(document).ready(function () {
    $('input:checkbox').click(function () {
        $('input:checkbox').not(this).prop('checked', false);
    });
});

function resetGlobalArrays() {
    activeTrajectories.length = 0;
    time.length = 0;
    compartments.length = 0;
    allSpecies.length = 0;
}

function btnAllTrajectoriesVisible() {
    $(".input-group.mb-3").removeClass("invisible");
    $(".input-group.mb-3").toggleClass("visible");
    $(".nav.nav-tabs.justify-content-center").removeClass("invisible");
    $(".nav.nav-tabs.justify-content-center").toggleClass("visible");

}

function clearHtmlTags() {
    d3.select("#allTrajectories").html("");
    d3.select("#allTrajectories").selectAll("*").remove();
    d3.select(".trajectory").html("");
    d3.select(".box").html("");
    d3.select('#list').html('');
    d3.select("#advanced_search_area").html("");
    d3.select("#search_button_area").html("");
    $("#search_buttons").hide();
}

function loadExampleCsv() {

    resetGlobalArrays();
    btnAllTrajectoriesVisible();
    clearHtmlTags();

    d3.csv("js/src/example_trajectories.csv", function (data) {
        globalData = data;
    });
    setTimeout(function () {
        prepareDataFromCsv();
        prepareNestedDataFromCsv(globalData);
        sumData();
        setHeatmapDropdown();
    }, 200);
}

function loadExampleJson() {

    resetGlobalArrays();
    btnAllTrajectoriesVisible();
    clearHtmlTags();


    d3.json("js/src/example_trajectories.json", function (data) {
        globalData = data;
    });
    setTimeout(function () {
        nestedData = d3.map();

        prepareHeatmapData(globalData);
        sumData();
        setHeatmapDropdown();

    }, 200);
}

function loadFile() {

    resetGlobalArrays();
    btnAllTrajectoriesVisible();
    clearHtmlTags();

    let file = document.querySelector('input[type=file]').files[0];
    reader = new FileReader();
    if (file.name.endsWith(".json")) {
        reader.addEventListener("load", readDataFromJson, false);
    } else if (file.name.endsWith(".csv")) {
        reader.addEventListener("load", readDataFromCsv, false);
    } else {
        alert("only json and csv allowed");
    }
    if (file) {
        reader.readAsText(file);
    }
    $('#fileBrowserModal').modal('toggle');
}

function readDataFromCsv() {
    globalData = d3.csvParse(reader.result);

    prepareDataFromCsv();
    prepareNestedDataFromCsv(globalData);
    sumData();
    setHeatmapDropdown();

}

function prepareDataFromCsv() {
    globalData.forEach(function (d) {
        d.elapsed_time = +d["elapsed time"];
        d.concentration = +d.concentration;

        if (!time.includes(d.elapsed_time)) {
            time.push(d.elapsed_time)
        }

        if (!allCompartments.includes(d.compartment)) {
            allCompartments.push(d.compartment)
        }

        if (!allSpecies.includes(d.species)) {
            allSpecies.push(d.species)
        }
    });

}

function prepareNestedDataFromCsv(data) {

    nestedData =
        d3.nest()
            .key(function (d) {
                return d.elapsed_time;
            })
            .key(function (d) {
                return "Node (0, 0)"

            })
            .key(function (d) {
                return d.compartment;
            })
            .key(function (d) {
                return d.species;
            })
            .rollup(function (v) {
                return d3.sum(v, function (d) {
                    return d.concentration;
                });
            })
            .map(data);
    console.log(nestedData);
}

function readDataFromJson() {

    globalData = JSON.parse(reader.result);
    nestedData = d3.map();

    prepareHeatmapData(globalData);
    sumData();
    setHeatmapDropdown();


}

//TODO Playbutton für Slider anfügen

function prepareHeatmapData(data) {


    for (let currentKey in data) {

        if (data[currentKey] !== null) {
            if (typeof (data[currentKey]) === "object") {

                if (parent === "trajectory-data") {
                    currentTime = currentKey;
                    if (!time.includes(currentKey)) {
                        time.push(parseFloat(currentKey));
                        nestedData.set(currentKey, d3.map())
                    }
                }

                if (parent === "concentration-data") {
                    currentNode = currentKey;
                    if (!allNodes.includes(currentKey)) {
                        allNodes.push(currentKey)

                    }
                    nestedData.get(currentTime).set(currentNode, d3.map())
                }

                if (parent === "concentrations") {
                    currentCompartment = currentKey;
                    if (!allCompartments.includes(currentKey)) {
                        allCompartments.push(currentKey);

                    }
                    nestedData.get(currentTime).get(currentNode).set(currentCompartment, d3.map())
                }
                const grandparent = parent;
                parent = currentKey;
                prepareHeatmapData(data[currentKey]);
                parent = grandparent;

            } else {

                if (currentKey === "time-unit") {

                    timeUnit = data[currentKey];

                } else if (currentKey === "concentration-unit") {

                    concentrationUnit = data[currentKey]
                } else {
                    if (!allSpecies.includes(currentKey)) {
                        allSpecies.push(currentKey);
                    }
                    nestedData.get(currentTime).get(currentNode).get(currentCompartment).set(currentKey, data[currentKey]);
                }
            }
        }
    }


}

function getCompartmentFromSpecies(species) {

    for (let currentTrajectory in summedData) {
        console.log(currentTrajectory);
        if (currentTrajectory.split("_")[1] === species) {
            return currentTrajectory.split("_")[0];
        }
    }
}

function setHeatmapDropdown() {

    let dropdown = d3.select(".heat")
        .append("div")
        .attr("class", "btn-group")
        .attr("id", "heatmap_dropdown")
        .style("margin-top", "5px")
        .style("position", "relative")
        .append("button")
        .attr("type", "button")
        .attr("class", "btn btn-primary dropdown-toogle")
        .attr("id", "dropdown_button")
        .attr("data-toggle", "dropdown")
        .attr("aria-haspopup", "true")
        .attr("aria-expanded", "flase")
        .text("select species");

    d3.select("#heatmap_dropdown")
        .append("div")
        .attr("class", "dropdown-menu")
        .attr("id", "heat_menu");

    for (let i in allSpecies) {
        d3.select("#heat_menu")
            .append("a")
            .attr("class", "dropdown-item")
            .attr("id", i)
            .text(allSpecies[i])
            .on("click", function () {

                $("#dropdown_button").text("species: " + $(this).text());
                d3.selectAll('.heat svg').remove();
                d3.selectAll('#slider_div svg').remove();

                setHeatmapRange();
                setHeatMapSvg();
                drawSilder($(this).text());
                clearHtmlTags();


            })

    }
}


function setHeatmapRange() {

    nestedData.keys().forEach(function (timestep) {
        nestedData.get(timestep).keys().forEach(function (node) {
            if (!heatmapXRange.includes(node.split(regEx)[1])) {
                heatmapXRange.push(node.split(regEx)[1]);
            }

            if (!heatmapYRange.includes(node.split(regEx)[2])) {
                heatmapYRange.push(node.split(regEx)[2]);
            }
        })
    });

    heatmapXRange.sort(function sortNumber(a, b) {
        return a - b;
    });

    heatmapYRange.sort(function sortNumber(a, b) {
        return a - b;
    });
}

let gridSize = Math.floor(heatwidth / time.length);

function drawHeatmapLegend() {

    d3.select("#legend-traffic").remove();
    d3.select(".legendRect").remove();
    d3.select(".axislegend").remove();


    let countScale = d3.scaleLinear()
        .domain([0, d3.max(heatmapData, function (d) {
            return d.value
        })
        ])
        .range([0, heatwidth]);

//Calculate the variables for the temp gradient
    let numStops = 10;
    let countRange = countScale.domain();
    countRange[2] = countRange[1] - countRange[0];
    let countPoint = [];
    for (var i = 0; i < numStops; i++) {
        countPoint.push(i * countRange[2] / (numStops - 1) + countRange[0]);
    }//for i

//Create the gradient
    heatmapSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-traffic")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%")
        .selectAll("stop")
        .data(d3.range(numStops))
        .enter().append("stop")
        .attr("offset", function (d, i) {
            return countScale(countPoint[i]) / heatwidth;
        })
        .attr("stop-color", function (d, i) {
            return heatmapColor(countPoint[i])
        });


    let legendWidth = Math.min(heatwidth, 400);
//Color Legend container
    let legendsvg = heatmapSvg.append("g")
        .attr("class", "legendWrapper")
        .attr("transform", "translate(0,10)");

//Draw the Rectangle
    legendsvg.append("rect")
        .attr("class", "legendRect")
        .attr("x", 0)
        .attr("y", 390)
        //.attr("rx", hexRadius*1.25/2)
        .attr("width", legendWidth)
        .attr("height", 10)
        .style("fill", "url(#legend-traffic)");


//Set scale for x-axis
    let xScale = d3.scaleLinear()
        .range([-legendWidth / 2, legendWidth / 2])
        .domain([0, d3.max(heatmapData, function (d) {
            return d.value

        })])

//Define x-axis
    let xAxis = d3.axisBottom()
        .ticks(5)
        //.tickFormat(formatPercent)
        .scale(xScale);

//Set up X axis
    legendsvg.append("g")
        .attr("class", "axislegend")
        .attr("transform", "translate(195,400)")
        .call(xAxis);

}

function setHeatMapSvg() {

// append the svg object to the body of the page
    heatmapSvg = d3.select(".heat")
        .append("svg")
        .attr("width", heatwidth + heatMargin.left + heatMargin.right)
        .attr("height", heatheight + heatMargin.top + heatMargin.bottom)
        .append("g")
        .attr("transform",
            "translate(30,10)");


// Build X scales and axis:
    heatmapX = d3.scaleBand()
        .range([0, heatwidth])
        .domain(heatmapXRange)
        .padding(0.01);


// Build X scales and axis:
    heatmapY = d3.scaleBand()
        .range([heatheight, 0])
        .domain(heatmapYRange)
}

function getHeatmapData(currentTimeStep, compartment, species) {

    heatmapData.length = 0;

    let obj;

    nestedData.get(currentTimeStep).keys().forEach(function (node) {

        if (nestedData.get(currentTimeStep).get(node).get(compartment) !== undefined) {

            if (nestedData.get(currentTimeStep).get(node).get(compartment).get(species) === undefined) {
                obj = {
                    //  name: compartment+ "_" + species,
                    x: node.split(regEx)[1],
                    y: node.split(regEx)[2],
                    value: 0
                };
                heatmapData.push(obj);
            } else {
                obj = {
                    x: node.split(regEx)[1],
                    y: node.split(regEx)[2],
                    value: nestedData.get(currentTimeStep).get(node).get(compartment).get(species)
                };
                heatmapData.push(obj);
            }

        } else {

            obj = {
                //  name: compartment+ "_" + species,
                x: node.split(regEx)[1],
                y: node.split(regEx)[2],
                value: 0
            };
            heatmapData.push(obj);

        }

    });
}

function setHeatmapColor(compartment, species) {

    if ($('input[name="check"]:checked').val() === "relative") {

        return d3.scaleLinear()
            .range(["#f1ff7f", "#0cac79"])
            .domain([0, d3.max(heatmapData, function (d) {
                return d.value

            })
            ])
    } else {

        return d3.scaleLinear()
            .range(["#f1ff7f", "#0cac79"])
            .domain([0, d3.max(summedData[compartment + "_" + species], function (d) {
                return d.y;

            })
            ])
    }
}

let heatmapColor;

function drawHeatmap(currentValue, species) {

    heatmapSvg.selectAll()
        .data(heatmapData, function (d) {
            return d.x + ':' + d.y;
        })
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return heatmapX(d.x)
        })
        .attr("y", function (d) {
            return heatmapY(d.y)
        })
        .attr("width", heatmapX.bandwidth())
        .attr("height", heatmapY.bandwidth())
        .style("stroke-width", "2")
        .style("stroke", "black")
        .style("stroke-opacity", 0.6)
        .style("fill", function (d) {
            return heatmapColor(d.value)
        })
        .on("mouseover", function (d) {
            d3.select(this)
                .style("stroke-width", "5")

            d3.select("#data")
                .append("p")
                .attr("position", "absolute")
                .attr("bottom", "0")
                .text("Node (" + d.x + "," + d.y + ")")

            d3.select("#data")
                .append("p")
                .attr("id", "showed_species")
                .attr("position", "absolute")
                .attr("bottom", "0");

            if (d.value === 0) {
                d3.select("#showed_species").text("species: nothing to find here")
            } else {
                d3.select("#showed_species").text("species: " + species)
            }


            d3.select("#data")
                .append("p")
                .attr("id", "showed_species")
                .attr("position", "absolute")
                .attr("bottom", "0")
                .text("possible compartments: " + nestedData.get(currentValue).get("Node (" + d.x + ", " + d.y + ")").keys());


            d3.select("#data")
                .append("p")
                .attr("position", "absolute")
                .attr("bottom", "0")
                .text("value: " + d.value)
        })
        .on("mouseleave", function () {

            d3.select(this)
                .style("stroke-width", "2")
                .style("stroke-opacity", 0.6)

            d3.select("#data")
                .selectAll("p").remove();
        })
        .on("click", function (d) {
            drawGraphFromNode(d);
            clickButton(getId(getCompartmentFromSpecies(species), species));
            setChartTitle("Node (" + d.x + "," + d.y + ")");
        })


}


let selectedTime;

function changeVerticalLineData() {


    d3.select(".verticalLine")
        .attr("x1", x(selectedTime))
        .attr("x2", x(selectedTime));


    let data  = summedNodeData[activeTrajectories[0]];
    data = data[Math.trunc(selectedTime/10)];

    d3.select(".verticalLineLabel")
        .datum(data)
        .attr("transform", function(d) {
            return "translate(" + x(d.x) + "," + y0(d.y) + ")";
        }).text(function (d) {
            return d.y;

    });

    d3.select(".verticalLineCircle")
        .datum(data)
        .attr("transform", function(d) {
            return "translate(" + x(d.x) + "," + y0(d.y) + ")";
        });


    let data2;

    data2 = summedNodeData[activeTrajectories[1]];
    data2 = data2[Math.trunc(selectedTime / 10)];

    d3.select(".verticalLineLabel2")
        .datum(data2)
        .attr("transform", function (d) {
            return "translate(" + x(d.x) + "," + y1(d.y) + ")";
        }).text(function (d) {
        return d.y;

    });

    d3.select(".verticalLineCircle2")
        .datum(data2)
        .attr("transform", function (d) {
            return "translate(" + x(d.x) + "," + y1(d.y) + ")";
        })


}

function drawSilder(species) {


    var marginSlider = {top:50, right:50, bottom:0, left:50},
        widthSlider = 600 - marginSlider.left - marginSlider.right,
        heightSlider = 200 - marginSlider.top - marginSlider.bottom;

    var svgSlider = d3.select("#slider_div")
        .append("svg")
        .attr("width", widthSlider + marginSlider.left + marginSlider.right)
        .attr("height", heightSlider + marginSlider.top + marginSlider.bottom);

    let compartment = getCompartmentFromSpecies(species);

        selectedTime = time[0];

    getHeatmapData(selectedTime, compartment, species);
    heatmapColor = setHeatmapColor(compartment, species);
    drawHeatmap(selectedTime, species);

    //TODO hier weiter machen

//https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763

    var moving = false;
    var currentValue = 0;
    var targetValue = widthSlider;

    var playButton = d3.select("#play-button");

    console.log(time[time.length-1]);

    var xtime = d3.scaleTime()
        .domain([0, time.length-1])
        .range([0, targetValue])
        .clamp(true);



    let slider =
    svgSlider
        .append("g")
        .attr("class", "slider")
        .attr("transform", "translate(50,60)");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", xtime.range()[0])
        .attr("x2", xtime.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() {
                selectedTime = time[d3.event.x];
               update(xtime.invert(selectedTime));
console.log(selectedTime);
                // selectedTime = time[sliderSimple.value() / 10];

                getHeatmapData(selectedTime, compartment, species);
                heatmapColor = setHeatmapColor(compartment, species);
                drawHeatmap(selectedTime, species);
                drawHeatmapLegend();
                changeVerticalLineData();
            })
        );

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(xtime.ticks(10))
        .enter()
        .append("text")
        .attr("x", xtime)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { d });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    var label = slider.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(time[0])
        .attr("transform", "translate(0," + (-25) + ")")

    function update(h) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        label
            .attr("x", x(h))
            .text(x(h));
    }


    //
    //
    //
    // sliderSimple = d3
    //     .sliderBottom()
    //     .min(0)
    //     .max(time.length * 10)
    //     .width(600)
    //     .ticks(10)
    //     .step(10)
    //     .default(0.001)
    //     .on('oninput', function () {
    //         selectedTime = time[sliderSimple.value() / 10];
    //
    //         getHeatmapData(selectedTime, compartment, species);
    //         heatmapColor = setHeatmapColor(compartment, species);
    //         drawHeatmap(selectedTime, species);
    //         drawHeatmapLegend();
    //         changeVerticalLineData();
    //
    //     });
    //
    // var gSimple = d3
    //     .select('#slider_div')
    //     .append('svg')
    //     .attr('width', 700)
    //     .attr('height', 100)
    //     .style("margin-left", "25%")
    //     .append('g')
    //     .attr('transform', 'translate(30,30)');
    //
    // gSimple.call(sliderSimple);
    //
    // d3.select('p#value-simple').text(d3.format('.2')(sliderSimple.value()));
    //
    //
    //
    // // console.log (heatmapData);


}

function initializeLineDataView() {

    svgMain.append("line")
        .attr("class", "verticalLine")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", height)
        .style("stroke-width", 1)
        .style("stroke", "#808080")
        .style("fill", "none");


    svgMain.append("text")
        .attr("class","verticalLineLabel")
        .attr("x", 10)
        .attr("style", "font-size: 15px")
        .attr("dy", 15)

    svgMain.append("circle")
        .attr("class", "verticalLineCircle")
        .attr("r", 7)
        .style("stroke", color[0])
        .attr("x", 0)
        .attr("dy", 0)
        .style("fill", "none")
        .style("stroke-width", "1px")
        .style("opacity", "1");

    svgMain.append("text")
        .attr("class","verticalLineLabel2")
        .attr("x", 10)
        .attr("style", "font-size: 15px")
        .attr("dy", 15);

    svgMain.append("circle")
        .attr("class", "verticalLineCircle2")
        .attr("r", 7)
        .style("stroke", color[1])
        .attr("x", 0)
        .attr("dy", 0)
        .style("fill", "none")
        .style("stroke-width", "1px")
        .style("opacity", "1");
}

function drawGraphFromNode(data) {
    compartments.length = 0;

    globalNode = "Node (" + data.x + ", " + data.y + ")";

    nestedData.keys().forEach(function (timestep) {
        nestedData.get(timestep).get(globalNode).keys().forEach(function (compartment) {
            if (!compartments.includes(compartment)) {
                compartments.push(compartment)
            }
        })
    })

    //$(".btn-outline-secondary.active").removeClass("active");
    activeTrajectories.length = 0;
    clearHtmlTags();
    summCurrentNodeData();
    initializeMainContent();
    initializeLineDataView();


}

function initializeMainContent() {
    console.log(nestedData);
    addSelectionButtons();
    initialMainSvg();
    prepareModal();
    addListOfSpecies();
    globalSearchIterator = 0;
    searchButtonDataArray.length = 0;
    addAppendButton();
    addCompartmentSelection();


}

function sumData() {

    let rememberSpecies = [];
    allCompartments.forEach(function (comp) {

        nestedData.keys().forEach(function (timestep) {

            nestedData.get(timestep).keys().forEach(function (node) {

                if (nestedData.get(timestep).get(node).get(comp) !== undefined && nestedData.get(timestep).get(node).get(comp).keys() !== undefined) {

                    nestedData.get(timestep).get(node).get(comp).keys().forEach(function (spe) {

                        if (!rememberSpecies.includes(spe) && nestedData.get(timestep).get(node).get(comp).get(spe) !== 0 && nestedData.get(timestep).get(node).get(comp).get(spe) !== undefined) {

                            rememberSpecies.push(spe);
                            globalNode = node;
                            summedData[comp + "_" + spe] = filterData(comp, spe);

                        }
                    })
                }
            })
        })
    })
}

function summCurrentNodeData() {

    let rememberSpecies = [];
    compartments.forEach(function (compartment) {
        nestedData.keys().forEach(function (timestep) {
            nestedData.get(timestep).get(globalNode).get(compartment).keys().forEach(function (species) {
                if (!rememberSpecies.includes(species) && nestedData.get(timestep).get(globalNode).get(compartment).get(species) !== undefined && nestedData.get(timestep).get(globalNode).get(compartment).get(species) > 0) {
                    rememberSpecies.push(species);
                    summedNodeData[compartment + "_" + species] = filterData(compartment, species);

                }
            })
        })
    })
}

function filterData(compartment, spec) {

    let trajectoryData = [];
    let obj = {};

    nestedData.keys().forEach(function (element) {
        if (nestedData.get(element).get(globalNode).get(compartment).get(spec) === undefined) {
            obj = {
                x: parseFloat(element),
                y: 0
            };
            trajectoryData.push(obj);
        } else {
            obj = {
                x: parseFloat(element),
                y: nestedData.get(element).get(globalNode).get(compartment).get(spec)
            };
            trajectoryData.push(obj);
        }
    });
    return trajectoryData;
}

// Functions to display all trajectories in a modal

function prepareModal() {


    let modalIterator = 0;
    let compart;
    let title;
    let selector;
    console.log(summedNodeData);
    compartments.forEach(function (comp) {
        let modDiv = d3.select("#allTrajectories")
            .append("div")
            .attr("id", "allTraj" + compartments.indexOf(comp))
            .append("h2")
            .text(comp);


    });

    for (let i in summedNodeData) {
        compart = i.substr(0, i.indexOf("_"));
        selector = "#allTraj" + compartments.indexOf(compart);
        title = i.substr(i.indexOf("_") + 1);
        defineModalSvg(selector, title);
        defineModalAxes(i, modalIterator);
        modalIterator++;
    }
}

function defineModalSvg(selector, text) {

    modalSvg = d3.select(selector)
        .append("svg")
        .attr("float", "left")
        .attr("width", modalWidth + modalMargin.left + modalMargin.right)
        .attr("height", modalHeight + modalMargin.top + modalMargin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + modalMargin.left + "," + modalMargin.top + ")");

    modalSvg.append("text")
        .attr("x", (modalWidth / 2))
        .attr("y", 0 - (modalMargin.top / 1.5))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(text);

    modalSvg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", (modalWidth / 2) + 20)
        .attr("y", modalHeight + 30)
        .attr("font-size", 15)
        .text("[ms]");

//label Y-Axis
    modalSvg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -10)
        .attr("x", 30)
        .attr("font-size", 15)
        .text("[nmol/l]");

}

function defineModalAxes(i, modalIterator) {
    let modalX = d3.scaleLinear()
        .domain(d3.extent(summedNodeData[i], function (d) {
            return d.x;
        }))
        .range([0, modalWidth]);


    modalSvg.append("g")
        .attr("transform", "translate(0," + modalHeight + ")")
        .call(d3.axisBottom(modalX).ticks(4));

//Add Y axis
    let modalY = d3.scaleLinear()
        .domain([0, d3.max(summedNodeData[i], function (d) {
            return d.y;
        })])
        .range([modalHeight, 0]);
    modalSvg.append("g")
        .call(d3.axisLeft(modalY).ticks(5));

    modalSvg.append("path")
        .datum(summedNodeData[i])
        .attr("id", "line_" + modalIterator)
        .style("stroke", getRandomColor())
        .attr("d", d3.line()
            .x(function (d) {

                return modalX(d.x);
            })
            .y(function (d) {
                return modalY(d.y);
            }));
}

// Functions to create buttons and their click events and how to create the ID and get data from the ID

function addSelectionButtons() {

    let rememberSpecies = [];

    compartments.forEach(function (comp) {
        d3.select(".box")
            .append("div")
            .attr("id", "compartment_" + compartments.indexOf(comp))
            .attr("class", "list " + comp)
            .append("h4")
            .text(comp);

        nestedData.keys().forEach(function (element) {
            nestedData.get(element).get(globalNode).get(comp).keys().forEach(function (buttonSpecies) {
                if (!rememberSpecies.includes(buttonSpecies) && nestedData.get(element).get(globalNode).get(comp).get(buttonSpecies) > 0) {
                    rememberSpecies.push(buttonSpecies);

                    d3.select("#compartment_" + compartments.indexOf((comp)))
                        .append("div")
                        .attr("class", "col-md-4 center-block")
                        .append("button")
                        .attr("id", getId(comp, buttonSpecies))
                        .attr("class", "btn btn-outline-secondary")
                        .attr("type", "button")
                        .text(buttonSpecies)
                        .on("click", function () {
                            clickButton(this.id)
                        });
                }
            })
        })
    });

    checkEmptyCompartment();
}

function clickButton(id) {
    if (activeTrajectories.length < 2 && $("#" + id).attr("class") === "btn btn-outline-secondary") {
        addLineOnClick(id);
    } else if ($("#" + id).attr("class") === "btn btn-outline-secondary active") {
        removeLineOnClick(id)

    }

}

function addLineOnClick(id) {
    activeTrajectories.push(getCompartmentFromId(id) + "_" + getSpeciesFromId(id));
    $("#" + id).toggleClass("active");
    prepareGraph();
}

function removeLineOnClick(id) {
    $("#" + id + ".btn-outline-secondary.active").removeAttr("style");
    $("#" + id).removeClass('active');
    //  $("#" + id + ".btn-outline-secondary:hover").css("background-color", "#6c757d");
    let index = activeTrajectories.indexOf(getCompartmentFromId(id) + "_" + getSpeciesFromId(id));
    if (index > -1) {
        activeTrajectories.splice(index, 1);
    }
    // $("#" + id));
    prepareGraph();
}

function getSpeciesFromId(id) {
    return allSpecies[parseInt(id.split("_")[1])]
}

function getCompartmentFromId(id) {
    return compartments[parseInt(id.split("_")[0])]
}

function getId(selectedComp, selectedSpecies) {
    return compartments.indexOf(selectedComp) + "_" + allSpecies.indexOf(selectedSpecies)
}

function checkEmptyCompartment() {

    compartments.forEach(function (comp) {

        // console.log('#compartment_' + compartments.indexOf(comp));

        if ($(".col-md-4").parents('#compartment_' + compartments.indexOf(comp)).length === 1) {

            //   console.log( "YES, the child element is inside the parent")

        } else {

            // console.log("NO, it is not inside");
            d3.select('#compartment_' + compartments.indexOf(comp))
                .append("h5")
                .text("[Empty]")

        }
    })

}

//Functions that organize the main window. Create coordinate system and draw the trajectories.

function initialMainSvg() {
    svgMain = d3.select(".trajectory")
        .attr("id", "chart")
        .append("svg")
        .attr("width", width)//+ margin.left + margin.right
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", "-50 +80 " + (100 + parseInt(d3.select(".trajectory").style("width"))) + " " + parseInt(d3.select(".trajectory").style("height")))
        .attr("preserveAspectRatio", "xMidYMax meet")
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
}

function setChartTitle(node) {
    svgMain.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("text-decoration", "underline")
        .text(node);
}

function removeElementsOfSvg() {
    d3.selectAll("#line").remove();
    d3.selectAll(".x.axis").remove();
    d3.selectAll(".y.axis.left").remove();
    d3.selectAll(".y.axis.right").remove();
    d3.selectAll(".label").remove();
}

function setPath(data, scale, axis, line, iterator, buttonId) {

    scale.domain([0, d3.max(data, function (d) {
        return d.y;
    })]);
    setYAxis(axis, color[iterator]);
    addLine(data, color[iterator], line);
    $(buttonId + ".btn-outline-secondary:not(:disabled):not(.disabled).active").css("background-color", color[iterator], "!important");


}

function prepareGraph() {
    let iterator = 0;
    removeElementsOfSvg();
    labelAxis();
    x.domain(d3.extent(time));
    setXAxis();
    activeTrajectories.forEach(function (content) {
        let data;
        let id;
        let scale = null;
        console.log(searchButtonDataArray);
        console.log(activeTrajectories);


        if (content.substr(0, content.indexOf("_")) === "search") {
            data = searchButtonDataArray[content.substr(content.indexOf("_") + 1)];
            id = "#search_" + content.substr(content.indexOf("_") + 1);
        } else {
            let comp = activeTrajectories[iterator].split("_")[0];
            let spec = activeTrajectories[iterator].split("_")[1];
            data = filterData(comp, spec);
            id = "#" + getId(comp, spec);
        }
        if (iterator === 0) {
            scale = y0;
            setPath(data, scale, "y axis left outer", "valueline1", iterator, id);
        } else if (iterator === 1) {
            scale = y1;
            setPath(data, scale, "y axis right", "", iterator, id);
        }
        iterator++
    })
}

function labelAxis() {
    //label X-Axis
    svgMain.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 50)
        .attr("font-size", 20)
        .text("Elapsed time [ms]");

//label Y-Axis
    svgMain.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -10)
        .attr("x", 130)
        .attr("font-size", 20)
        .text("Concentration [nmol/l]");
}

function setXAxis() {

    svgMain.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .attr("font-size", 15);
}

function setYAxis(name, color) {

    svgMain.append("g")
        .attr("class", name);

    if (name === "y axis right") {

        d3.select(".y.axis.right").attr("transform", "translate(" + width + " ,0)")
            .call(d3.axisRight(y1).tickFormat(d3.format('.2')))
            .styles({
                fill: "none", stroke: color
            })
            .attr("font-size", 17);

    } else if (name === "y axis left outer") {

        d3.select(".y.axis.left.outer")
            .call(d3.axisLeft(y0).tickFormat(d3.format('.2')))
            .styles({
                fill: "none", stroke: color
            })
            .attr("font-size", 17);
    } else if (name === "y axis left inner") {

        d3.select(".y.axis.left.inner")
            .call(d3.axisRight(y2).tickFormat(d3.format('.2')))
            .styles({
                fill: "none", stroke: color
            })
            .attr("font-size", 17)
    }
}

function addLine(data, color, name) {

    svgMain.append("path")
        .datum(data)
        .attr("id", "line")
        .style("stroke", color)
        .attr("d", valueline1
            .x(function (d) {
                return x(d.x);
            })
            .y(function (d) {
                if (name === "valueline1") {
                    return y0(d.y);
                } else if (name === "valueline3") {
                    return y2(d.y)
                } else {
                    return y1(d.y)
                }
            }));
}

// Functions that realize data selection from input

function sumSelectedData() {
    summedY.length = 0;
    nestedData.keys().forEach(function (timestep) {
        let sum = 0;
        compartments.forEach(function (comp) {
            highlightedSpecies.forEach(function (spec) {

                if (nestedData.get(timestep).get(globalNode).get(comp).get(spec) !== undefined) {

                    sum += nestedData.get(timestep).get(globalNode).get(comp).get(spec);
                }
            })
        });
        summedY.push(sum);
    });
    getLineObjectFromSummedY();
}

function getLineObjectFromSummedY() {
    let summedLineObject;
    let summedLineArray = [];

    for (let i = 0; i < time.length; i++) {
        summedLineObject = {
            x: time[i],
            y: summedY[i]
        };
        summedLineArray.push(summedLineObject);
    }
    searchButtonDataArray.push(summedLineArray);
}

function addListOfSpecies() {
    d3.select("#list")
        .append("ul")
        .attr("class", "list-group")
        .attr("id", "search_list");

    compartments.forEach(function (compartment) {
        d3.select("#search_list")
            .append("li")
            .attr("class", "list-group-item list-group-item-success")
            .text(compartment);

        for (let i in summedData) {
            if (i.substr(0, i.indexOf("_")) === compartment) {

                let id = getId(i.substr(0, i.indexOf("_")), i.substr(i.indexOf("_") + 1));
                d3.select("#search_list")
                    .append("li")
                    .attr("class", "list-group-item")
                    .attr("id", "listItem" + id)
                    .text(i.substr(i.indexOf("_") + 1))
            }
        }
    })

}

//advanced search area

function addCompartmentSelection() {

    d3.select("#advanced_search_area")
        .append("div")
        .attr("class", "search_div")
        .attr("id", "container_" + globalSearchIterator);

    d3.select("#container_" + globalSearchIterator)
        .append("div")
        .attr("class", "form-group col-md-4")
        .attr("id", "initial_selection")
        .append("select")
        .attr("id", "input_first_" + globalSearchIterator)
        .attr("class", "form-control");

    d3.select("#input_first_" + globalSearchIterator)
        .append("option")
        .text("species");

    d3.select("#input_first_" + globalSearchIterator)
        .append("option")
        .text("compartment");

    d3.select("#container_" + globalSearchIterator)
        .append("div")
        .attr("class", "form-row nr" + globalSearchIterator)
        .append("div")
        .attr("class", "form-group col-2")
        .append("select")
        .attr("class", "form-control")
        .attr("id", "input_second_" + globalSearchIterator);

    d3.select("#input_second_" + globalSearchIterator)
        .append("option")
        .text("contains");

    d3.select("#input_second_" + globalSearchIterator)
        .append("option")
        .text("not contains");

    d3.select(".form-row.nr" + globalSearchIterator)
        .append("div")
        .attr("class", "form-group col-md-4")
        .append("input")
        .attr("type", "text")
        .attr("class", "form-control")
        .attr("id", "input_string_" + globalSearchIterator);

    d3.select(".form-row.nr" + globalSearchIterator)
        .append("button")
        .attr("id", "remove_new_search_" + globalSearchIterator)
        .attr("class", "btn btn-outline-secondary")
        .attr("type", "button")
        .attr("style", "margin-left : 10px !important; margin-bottom : 15px !important ")
        // .attr("style", "margin-bottom : 10px !important")
        .text("remove")
        .on("click", function () {

            let identifier = $(this).attr("id").split("_")[3];
            d3.select("#container_" + identifier).html("");
            // globalSearchIterator--;
        });
}

function addAppendButton() {
    let buttonNumber = 0;

    d3.select("#advanced_search_area")
        .append("button")
        .attr("id", "add_new_search")
        .attr("class", "btn btn-outline-secondary")
        .attr("type", "button")
        .attr("style", "margin-left : 10px !important")
        .text("add search criteria ")
        .on("click", function () {
            globalSearchIterator++;
            addCompartmentSelection()
        });

    d3.select("#advanced_search_area")
        .append("button")
        .attr("id", "submit_search")
        .attr("class", "btn btn-outline-secondary")
        .attr("type", "button")
        .attr("style", "margin-left : 10px !important")
        .text("submit search ")
        .on("click", function () {

            $("#search_buttons").show();
            appendButtonForSelection(buttonNumber);
            searchFilter();
            buttonNumber++;

        });

    d3.select("#advanced_search_area")
        .append("input")
        .attr("type", "text")
        .attr("class", "form-control")
        .attr("style", "width : 300px !important ;margin-left : 10px !important ; display : -webkit-inline-box !important")
        .attr("id", "search_name");
}

function appendButtonForSelection(buttonNumber) {

    d3.select("#search_button_area")
        .append("button")
        .attr("id", "search_" + buttonNumber)
        .attr("class", "btn btn-outline-secondary")
        .attr("type", "button")
        .text($("#search_name").val())
        .on("click", function () {

            let id = this.id;

            if (activeTrajectories.length < 2 && $("#" + id).attr("class") === "btn btn-outline-secondary") {
                activeTrajectories.push(id);
                $("#" + id).toggleClass("active");
                prepareGraph();
            } else if ($("#" + id).attr("class") === "btn btn-outline-secondary active") {
                $("#" + id + ".btn-outline-secondary.active").removeAttr("style");
                $("#" + id).removeClass('active');
                let index = activeTrajectories.indexOf(id);
                if (index > -1) {
                    activeTrajectories.splice(index, 1);
                }
                prepareGraph();

            }
        });
}

function searchFilter() {

    let even2 = [];
    let searchArray = [];

    for (let i = 0; i < globalSearchIterator + 1; i++) {
        if ($("#input_first_" + i + " option:selected").text() !== "") {
            searchArray.push([$("#input_first_" + i + " option:selected").text(), $("#input_second_" + i + " option:selected").text(), $("#input_string_" + i).val()])
        }
    }

    for (let i in summedData) {
        even2.push(i);
    }

    // console.log(even2);
    //console.log(even2.keys());
    searchArray.forEach(function (d) {

        if (d[0] === "compartment") {
            if (d[1] === "not contains") {
                even2 = even2.filter(v => v.substr(0, v.indexOf("_")).includes(d[2]) === false)
            } else if (d[1] === "contains") {
                even2 = even2.filter(v => v.substr(0, v.indexOf("_")).includes(d[2]) === true)
            }
        }
    });

    searchArray.forEach(function (d) {
        if (d[0] === "species") {
            if (d[1] === "not contains") {
                even2 = even2.filter(v => v.substr(v.indexOf("_") + 1).includes(d[2]) === false)
            } else if (d[1] === "contains") {
                even2 = even2.filter(v => v.substr(v.indexOf("_") + 1).includes(d[2]) === true)
            }
        }
    });


    console.log(even2);
    highlightSpecies(even2);

}

function highlightSpecies(filteredSpecies) {

    $(".list-group-item").removeClass("list-group-item-info");
    highlightedSpecies.length = 0;
    filteredSpecies.forEach(function (spec) {

        highlightedSpecies.push(spec.substr(spec.indexOf("_") + 1));

        console.log(highlightedSpecies);

        $("li[id$=_" + allSpecies.indexOf(spec.substr(spec.indexOf("_") + 1)) + "]").toggleClass("list-group-item-info");


    });

    sumSelectedData();
}

// Other

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}



