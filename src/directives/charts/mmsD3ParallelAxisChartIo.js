'use strict';
 angular.module('mms.directives')
    .directive('mmsD3ParallelAxisChartIo', ['ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsD3ParallelAxisChartIo]);
function mmsD3ParallelAxisChartIo(ElementService, UtilsService, TableService, $compile, growl, $window) {
      
  var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {
   
    scope.rowHeaders=[]; //not null when render is called 1st time.      
    var d3 = $window.d3;  
    var svg = d3.select(element[0])
      .append('div')
      .append("svg:svg")
      .attr("class", "papchart");
        
    var processed = false;
    var ws = scope.mmsWs;
    var version = scope.mmsVersion;
    if (mmsViewCtrl) {
        var viewVersion = mmsViewCtrl.getWsAndVersion();
        if (!ws)
            ws = viewVersion.workspace;
        if (!version)
            version = viewVersion.version;
    }
    function vf_pplot(_out) {
        var outputs = _out;
        var width =900;
            var m = [0, 0, 25, 60]; //top, right, bottom, left
            
            var maxSize = 0;
            var size = 0;
                  
            //redefine top and right margin based on TB string length
            maxSize = 0;
            size = 0;
            for (var i = 0; i < outputs.variables.length; i++)
            {
              size = outputs.variables[i].length; //length of the string
              
              if (maxSize < size)
              {
                maxSize = size;
              }
            }
            
            m[0] = maxSize * 4.5 * 0.707 + 50; //to make label
            m[1] = maxSize * 4.5 * 0.707 + 10;
            
            //define width and height
            var w = width - m[1] - m[3],
              h = (width * 0.37) - m[0] - m[2];
            
            var x = d3.scale.ordinal().domain(outputs.variables).rangePoints([0, w]),
            y = {};
            
            var line = d3.svg.line(),
            axis = d3.svg.axis().ticks(5).orient("left"),foreground;
            //axis = d3.svg.axis().scale(y).ticks(5).orient("left");
            
            var colorscale = d3.scale.category10();
          
            var svg = d3.select(".papchart")
                   
              .attr("width", w + m[1] + m[3])
              .attr("height", h + m[0] + m[2])
              .append("svg:g")
              .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
            
            //Need to create a temporary object with the data, objectives, and threshold values
            //to scale the axes properly
            var minMax = {};

            outputs.variables.forEach(function(d, i){
              minMax[d] = {};
              
              //initialize minTest and maxTest variables
              var minTest = outputs.table[0].values[d];
              var maxTest = outputs.table[0].values[d];

              for (var j = 0; j < outputs.table.length; j++)
              {
                //test to see if minTest is still the minimum
                if (minTest > outputs.table[j].values[d])
                {
                  minTest = outputs.table[j].values[d];
                }
                
                //tests to see if maxTest is still the maximum
                if (maxTest < outputs.table[j].values[d])
                {
                  maxTest = outputs.table[j].values[d];
                }
              }
              minMax[d].min = minTest;
              minMax[d].max = maxTest;
            });
            
            var range = {};
            var minimum = {};
            var maximum = {};

            var percentScaling = 0.07;
            
            //make each minMax a bit bigger or smaller to better plot the data set
            outputs.variables.forEach(function(d, i){
              range[d] = Math.abs(minMax[d].max - minMax[d].min);
            
              minimum[d] = minMax[d].min - range[d] * percentScaling;
              maximum[d] = minMax[d].max + range[d] * percentScaling;
              
              //what if both the min and the max were equal?  Give it some "range" about the point
              if (minMax[d].max == minMax[d].min)
              {
                maximum[d] = minMax[d].max * (percentScaling + 1);
                minimum[d] = minMax[d].max * (1 - percentScaling);
              }
              
              //what if the only value for a variable is zero? Give it some "range" about zero
              if (minMax[d].max === 0 && minMax[d].min === 0)
              {
                maximum[d] = percentScaling;
                minimum[d] = -percentScaling;
              }
            });
            

            //Create a scale and brush for each variables.
            outputs.variables.forEach(function (d) {
              y[d] = d3.scale.linear()
                .domain([minimum[d], maximum[d]])
                .range([h, 0]);
              
            });
            
            var tooltip = svg.append('text')
             .style('opacity', 0)
             .style('font-family', 'sans-serif')
             .style('font-size', '13px');

            
            var axisData = [];
            var tickData = [];
            outputs.table.forEach(function(d){
              if ( d.tickColor === undefined)
                axisData.push(d);
              else
                tickData.push(d);
            });
            // Add foreground lines. background brush
            foreground = svg.append("svg:g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(axisData)
            .enter().append("svg:path")
            .attr("d", path)
            .on("mouseover", function(d) {
                tooltip
                .attr('x', d3.mouse(this)[0])
                .attr('y', d3.mouse(this)[1])
                .text(d.row)
                .transition(200)
                .style('opacity', 1);
            })
            .on("mouseout", function() {
              //remove the text element added on the mouseover event when the mouseout event is triggered
               tooltip
              .transition(200)
              .style('opacity', 0);
            })
            .attr("stroke", function(d, i){ return colorscale(i);})
            .attr("fill", "none")
            .style("stroke-width", "3px")
            .attr("cid", function(d,i){
              return d.cid;
            })
            .attr("config", function(d,i){
              return d.design;
            })
               //.attr("title", "TEST")
            .attr("class", function (d,i) {
                var string = "design " + d.cid + " selected";
                  return string;
            })
            //add title to the path.  mouseover shows it in bubble looking
            .append("svg:title")
            .text(function(d){return d.row;});

            // Add a group element for each variables.
            var g = svg.selectAll(".variables")
              .data(outputs.variables)
              .enter().append("svg:g")
              .attr("class", "variables")
              .attr("transform", function(d,i) { 
                  return "translate(" + x(d) + ")"; 
                })
              .call(d3.behavior.drag()
                  .origin(function(d) { 
                    return {x: x(d)}; 
                  })
                  .on("dragstart", dragstart)
                  .on("drag", drag)
                  .on("dragend", dragend));

            // Add an axis and title.
            g.append("svg:g")
              .attr("class", "axis")
              .each(function(d) { 
                d3.select(this).call(axis.scale(y[d])); 
              })
            .append("svg:text")
              .data(outputs.variables)
              .attr("y", -12)
              .attr("transform", "rotate(-45 0 0)") //deg y x
              .attr("x", 0)
              .attr("class", "axislabel")
              .text(function(d){
                return d;
              });

              var axisTick;                
              tickData.forEach(function(td){
                //Add  ticks
                //var axisTick = g.select("g.axis").append("g");
                //axisTick
                g.select("g.axis").append("g")
                .attr("transform", function (d) {
                    return "translate(0," + y[d](td.values[d]) + ")";
                })
                .attr("class", "objectivetick")
                .append("line")
                .attr("stroke", td.tickColor)
                .style("stroke-width", "3px")
                .attr("fill", "none")
                .attr("x1", -5)
                .attr("x2", 6)
                .attr("y2", 0)
                .on("mouseover", function(d) {
                  tooltip
                  .attr('x', d3.mouse(this)[0] + x(d))
                  .attr('y', d3.mouse(this)[1] + y[d](td.values[d]))
                  .text(td.row)
                  .transition(200)
                  .style('opacity', 1);
                })
                .on("mouseout", function(d) {
                  //remove the text element added on the mouseover event when the mouseout event is triggered
                   tooltip
                  .transition(200)
                  .style('opacity', 0);
                });
                
                /*axisTick.append("text")
                .attr("x", 8)
                .attr("y", 3)
                .attr("text-anchor", "start")
                .text(function (d) {
                    return td.row;
                });*/
            });
              
            function dragstart(d) 
            {
              i = outputs.variables.indexOf(d);
            }

            function drag(d) 
            {
              x.range()[i] = d3.event.x;
              outputs.variables.sort(function(a, b) { return x(a) - x(b); });
              g.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
              foreground.attr("d", path);
            }

            function dragend(d) 
            {
              x.domain(outputs.variables).rangePoints([0, w]);
              var t = d3.transition().duration(500);
              t.selectAll(".variables").attr("transform", function(d) { return "translate(" + x(d) + ")"; });
              t.selectAll(".foreground path").attr("d", path);
            }

            // Returns the path for a given data point.
            function path(d) {
              d = d.values;
              return line(outputs.variables.map(function (p) {
                  //console.log(x(p) + " " + y[p](d[p]) + " " + d[p]);
                  return [x(p), y[p](d[p])];
                }));
            }
    }//end of vf_pplot()

    scope.render = function() {
      if (scopetableColumnHeadersLabel.length === 0) return;
      svg.selectAll('*').remove();
      
      for ( var k = 0; k < scopeTableIds.length; k++){
        var  dataseries= [];
        var tickColor;
        for ( var i = 0; i < scope.datavalues[k].length; i++){
            tickColor = undefined; //reset
            var tvalues = [];
            for ( var j = 0; j < scope.datavalues[k][i].length; j++){
              var datavalue = null;
              if (scope.datavalues[k][i][j].type === "Property" || scope.datavalues[k][i][j].type === "Port")
                  datavalue = scope.datavalues[k][i][j].defaultValue;
              else if (scope.datavalues[k][i][j].type === 'Slot')
                  datavalue = scope.datavalues[k][i][j].value[0];
              if (datavalue && datavalue.type === 'LiteralString')
                 tvalues[scopetableColumnHeadersLabel[k][j]] = Number(datavalue.value);
              else if (datavalue && (datavalue.type === 'LiteralReal' || datavalue.type === 'LiteralInteger'))
                 tvalues[scopetableColumnHeadersLabel[k][j]] = datavalue.value;
            }
            if (scope.tableRowHeaders[k][i].name === scope.tick1){
               tickColor = scope.tick1color;
            }
            else if ( scope.tableRowHeaders[k][i].name === scope.tick2){
               tickColor = scope.tick2color;
            }
            else if ( scope.tableRowHeaders[k][i].name === scope.tick3){
               tickColor = scope.tick3color;
            }
            dataseries[i] = { row: scope.tableRowHeaders[k][i].name, 
                              tickColor: tickColor,
                              values:tvalues};
        }
        var modelData = {
             variables: scopetableColumnHeadersLabel[k],
             table: dataseries //columnHeader and values
        };
      
      /*var dummyData = {
            "variables": [
              "Solar Array Area (m^2)",
              "Battery Capacity (W-hr)",
              "HGA Power (W)",
              "Data Rate (bits/min)",
              "Data Storage (bits)"
            ],
           
            "table": [
              {
                "row": "BaseLine",
                "tickColor" : undefined,
                "values":{
                "Solar Array Area (m^2)": 5,
                "Battery Capacity (W-hr)": 11.2,
                "HGA Power (W)": 25,
                "Data Rate (bits/min)" :15.5,
                "Data Storage (bits)": 20
                }
              },
              {
                "row": "Option1",
                "tickColor" : undefined,
                 "values":{
                "Solar Array Area (m^2)": 5,
                "Battery Capacity (W-hr)": 11.2,
                "HGA Power (W)": 25,
                "Data Rate (bits/min)" :15.5,
                "Data Storage (bits)": 20
                }
              },
              {
                "row": "Option2",
                "tickColor" : undefined,
                "values":{
                "Solar Array Area (m^2)": 5,
                "Battery Capacity (W-hr)": 11.2,
                "HGA Power (W)": 25,
                "Data Rate (bits/min)" :15.5,
                "Data Storage (bits)": 20
                }
              }
            ]
          };*/
        vf_pplot(modelData);
      }
    };//end of render
 
    scope.$watch('datavalues', function(newVals, oldVals) {
        return scope.render();
    }, true);
      
    var scopeTableTitles=[];
    var scopeTableIds = [];
    var scopetableColumnHeadersLabel= [];
    var dataIdFilters = [];

    TableService.readTables (scope.mmsEid,ws, version)
      .then(function(value) {
        scopeTableTitles = value.tableTitles;
        scopeTableIds = value.tableIds;
        scopetableColumnHeadersLabel= value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
        dataIdFilters = value.dataIdFilters;
      });
    }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        mmsEid: '@',
        tick1: '@',
        tick1color: '@',
        tick2: '@',
        tick2color: '@',
        tick3: '@',
        tick3Color: '@'
      },
      link: mmsChartLink
    }; //return
}



