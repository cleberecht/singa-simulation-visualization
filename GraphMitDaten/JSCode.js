







//Settings of the graph

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 50, bottom: 30, left: 50},
    width = 700 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;


// Set the ranges
var x = d3.scale.linear().range([0, width]);
var y0 = d3.scale.linear().range([height, 0]);
var y1 = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxisLeft = d3.svg.axis().scale(y0)
    .orient("left").ticks(5);

var yAxisRight = d3.svg.axis().scale(y1)
    .orient("right").ticks(5);


// Define the lines
var valueline = d3.svg.line()
    .x(function (d) {
        return x(d.elapsed_time);
    })
    .y(function (d) {
        return y0(d.concentration);
    });


var valueline2 = d3.svg.line()
    .x(function (d) {
        return x(d.elapsed_time);
    })
    .y(function (d) {
        return y1(d.concentration);
    });

//Define div container
var div = d3.select("body")
    .append("div")
    .attr("id", "Boxdiv")
    .style("position", "absolute")
    .style("top", "350px")
    .style("left", 0)
    .style("width", 350 + "px")
    .style("height", 100 + "px");
//  .style("background-color", "blue");


// Adds the svg canvas
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Label X-Axis
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + 20)
    .text("Elapsed time [ms]");

//Label Y-Axis
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -50)
    .attr("x", -70)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Concentration [nmol/l]");


// _________________Get the data_____________________________________________________
d3.csv("node_(0, 0)_concentrations.csv", function (error, data) {
    data.forEach(function (d) {
        d.species = d.species
        d.elapsed_time = +d.elapsed_time;
        d.concentration = +d.concentration;
        d.compartment = d.compartment;

    });


    // Nest the Data________________________________________________________________________________________________

    nested_data = d3.nest()
        .key(function (d) {
            return d.species;
        })
        .key(function (d) {
            return d.compartment;
        })
        .rollup(function (d) {
            d.scalemin = d3.min(d, function (d) {
                return d.concentration
            });

            d.scalemax = d3.max(d, function (d) {
                return d.concentration;
            });
            return d;
        })

        .entries(data);

    console.log(nested_data[11].values[0].values.scalemax);


    //-----------Key the data for drop down---------------------------------------------------------------------------

    var compartmentSelection = d3.nest()
        .key(function (d) {
            return d.compartment;
        })
        .rollup(function (v) {
            return v.length;
        })
        .entries(data);


    var speciesSelection = d3.nest()
        .key(function (d) {
            return d.species;
        })
        .rollup(function (v) {
            return v.length;
        })
        .entries(data);


    //---------------------------------------------------------------------------------------------------------------

    // Add Coiceboxes-------------------------------------------------------------------------------------------------


    selectedCompartment = addChoiceBoxComp(compartmentSelection, "CompartmentList");

    selectedSpecies = addChoiceboxSpec(speciesSelection, "SpeciesList");


    // The Second Box-----------------------------------------------------------------


    selectedCompartment2 = addChoiceBoxComp(compartmentSelection, "CompartmentList2");

    selectedSpecies2 = addChoiceboxSpec(speciesSelection, "SpeciesList2");

    //The maximum of the Dataset------------------------------------------------------------

    var scalemax = getTheRange(nested_data, selectedSpecies, selectedCompartment, selectedSpecies2, selectedCompartment2)[0];
    var scalemax2 = getTheRange(nested_data, selectedSpecies, selectedCompartment, selectedSpecies2, selectedCompartment2)[1];


    // Add the X Axis
    x.domain(d3.extent(data, function (d) {
        return d.elapsed_time;
    }));

    setXAxis(svg, xAxis);

    // Define the Y Axis and the valuelines. If statement for matching datarange-------------------------------------
    if (Math.abs(Math.log10(Math.max(scalemax, scalemax2))) - Math.abs(Math.log10(Math.min(scalemax, scalemax2))) < 0.7) {

        // Add the Y Axis
        y0.domain([0, Math.max(scalemax, scalemax2)]);

        setOneYAxis(svg, yAxisLeft, "y axis left");


        // Add the lines
        svg.append("path")
            .data([data])
            .attr("id", "line")
            .style("stroke", "#d95f02")
            .attr("d", valueline(data.filter(function (d) {
                return d.species == selectedSpecies && d.compartment == selectedCompartment

            })));


        svg.append("path")
            .data([data])
            .attr("id", "line2")
            .style("stroke", "#66a61e")
            .attr("d", valueline2(data.filter(function (d) {
                return d.species == selectedSpecies2 && d.compartment == selectedCompartment2

            })));

    } else {


// Else Statement when the ranges are different--------------------------------------------------

        // Add the Y Axis
        y0.domain([0, d3.max(data.filter(function (d) {
            return d.species === selectedSpecies && d.compartment === selectedCompartment
        }), function (d) {
            return d.concentration
        })]);


        y1.domain([0, d3.max(data.filter(function (d) {
            return d.species === selectedSpecies2 && d.compartment === selectedCompartment2
        }), function (d) {
            return d.concentration
        })]);

        setOneYAxis(svg, yAxisLeft, "y axis left", "#d95f02");
        setOneYAxis(svg, yAxisRight, "y axis right", "#66a61e");


        //Add the lines---------------------------------------------------------
        svg.append("path")
            .data([data])
            .attr("id", "line")
            .style("stroke", "#d95f02")
            .attr("d", valueline(data.filter(function (d) {
                return d.species == selectedSpecies && d.compartment == selectedCompartment

            })));


        svg.append("path")
            .data([data])
            .attr("id", "line2")
            .style("stroke", "#66a61e")
            .attr("d", valueline2(data.filter(function (d) {
                return d.species == selectedSpecies2 && d.compartment == selectedCompartment2

            })));


    }


});


//Functions


//Get the maximum value of a dataset____________________________________________________________________________________
function getTheRange(nested_data, spec1, comp1, spec2, comp2) {

    var scalemax = 0;

    for (var zzz = 0; zzz < nested_data.length; zzz++) {
        if (nested_data[zzz].key === spec1) {
            for (var xxx = 0; xxx < nested_data[zzz].values.length; xxx++) {
                if (nested_data[zzz].values[xxx].key === comp1) {
                    scalemax = nested_data[zzz].values[xxx].values.scalemax;

                }
            }


        }
    }

    var scalemax2 = 0;

    for (var zzz = 0; zzz < nested_data.length; zzz++) {
        if (nested_data[zzz].key === spec2) {
            for (var xxx = 0; xxx < nested_data[zzz].values.length; xxx++) {
                if (nested_data[zzz].values[xxx].key === comp2) {
                    scalemax2 = nested_data[zzz].values[xxx].values.scalemax;

                }
            }


        }
    }
    return [scalemax, scalemax2];
}

//Add choicebox for compartment_________________________________________________________________________________________
function addChoiceBoxComp(compartmentSelection, name) {
    //Dropdown Box 1 Compartment

    var dropdown = d3.select('#Boxdiv')
        .append("select")
        .attr("id", name)
        .on('change', onchange);

    var options =
        dropdown.selectAll('option')
            .data(compartmentSelection)
            .enter()
            .append('option');


    options.text(function (d) {
        return d.key

    })
        .attr("value", function (d) {
            return d.key
        });

    return d3.select("#" + name).property("value");

}

//Set the choiceboxes for species___________________________________________________________________________________________________
function addChoiceboxSpec(speciesSelection, name) {
    //Dropdown box 2 (Species)
    var dropdown2 = d3.select('#Boxdiv')
        .append("select")
        .attr("id", name)
        .on('change', onchange);

    var options2 =
        dropdown2.selectAll('option')
            .data(speciesSelection)
            .enter()
            .append('option');

    options2.text(function (d) {
        return d.key
    })
        .attr("value", function (d) {
            return d.key
        });

    return d3.select("#" + name).property("value");

}

//Set the Axis__________________________________________________________________________________________________________
function setXAxis(svg, XA) {

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(XA);


}

function setOneYAxis(svg, call, name, fill) {
    svg.append("g")
        .attr("class", name)
        .style("fill", fill)
        .call(call);
}

//Function onChange ____________________________________________________________________________________________________
function onchange() {
    // Add the valueline path.

    d3.csv("node_(0, 0)_concentrations.csv", function (error, data) {
        data.forEach(function (d) {
            d.species = d.species
            d.elapsed_time = +d.elapsed_time;
            d.concentration = +d.concentration;
            d.compartment = d.compartment;
        });


        selectedCompartment = d3.select("#CompartmentList").property("value");

        selectedSpecies = d3.select("#SpeciesList").property("value");

        selectedCompartment2 = d3.select("#CompartmentList2").property("value");

        selectedSpecies2 = d3.select("#SpeciesList2").property("value");


        // Select the section we want to apply our changes to
        var svg = d3.select("body").transition();

        x.domain(d3.extent(data, function (d) {
            return d.elapsed_time;
        }));

        var scalemax = getTheRange(nested_data, selectedSpecies, selectedCompartment, selectedSpecies2, selectedCompartment2)[0];
        var scalemax2 = getTheRange(nested_data, selectedSpecies, selectedCompartment, selectedSpecies2, selectedCompartment2)[1];


        if (Math.abs(Math.log10(Math.max(scalemax, scalemax2))) - Math.abs(Math.log10(Math.min(scalemax, scalemax2))) < 0.7) {

            y0.domain([0, Math.max(scalemax, scalemax2)]);
            y1.domain([0, 0]);

            // Make the changes
            svg.select("#line")   // change the line
                .duration(750)
                .attr("d", valueline(data.filter(function (d) {
                    return d.species === selectedSpecies && d.compartment === selectedCompartment
                })));

            svg.select("#line2")   // change the line
                .duration(750)
                .attr("d", valueline(data.filter(function (d) {
                    return d.species === selectedSpecies2 && d.compartment === selectedCompartment2
                })));


            svg.select(".y.axis.left") // change the y axis
                .duration(750)
                .call(yAxisLeft);


            svg.select(".y.axis.right") // change the y axis
                .duration(750)
                .call(yAxisRight);


        } else {

            y0.domain([0, d3.max(data.filter(function (d) {
                return d.species == selectedSpecies && d.compartment == selectedCompartment

            }), function (d) {
                return d.concentration
            })]);


            // Make the changes
            svg.select("#line")   // change the line
                .duration(750)
                .attr("d", valueline(data.filter(function (d) {
                    return d.species == selectedSpecies && d.compartment == selectedCompartment
                })));


            svg.select(".y.axis.left") // change the y axis
                .duration(750)
                .call(yAxisLeft);




            y1.domain([0, d3.max(data.filter(function (d) {
                return d.species === selectedSpecies2 && d.compartment === selectedCompartment2

            }), function (d) {
                return d.concentration
            })]);

            svg.select("#line2")   // change the line
                .duration(750)
                .attr("d", valueline2(data.filter(function (d) {
                    return d.species === selectedSpecies2 && d.compartment === selectedCompartment2
                })));

            svg.select(".y.axis.right") // change the y axis
                .duration(750)
                .call(yAxisRight);


        }

    });


}