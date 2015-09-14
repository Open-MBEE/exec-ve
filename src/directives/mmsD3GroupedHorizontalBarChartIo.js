'use strict';
 angular.module('mms.directives')
    .directive('mmsD3GroupedHorizontalBarChartIo', ['ElementService', 'UtilsService','$compile', 'growl','$window', mmsD3GroupedHorizontalBarChartIo]);
function mmsD3GroupedHorizontalBarChartIo(ElementService, UtilsService, $compile, growl, $window, mmsViewCtrl) {
      
    var mmsChartLink = function(scope, element, attrs) {
             
        var d3 = $window.d3;  
        var svgP = d3.select(element[0]).append('div');
          
        var udcolors = [];
        if (scope.color !== undefined){
          scope.color.split(";").forEach( function(d){
            var temp = d.split(':');
            udcolors[Number(temp[0])] = temp[1].split(",");
          });
         }
         
           scope.tableColumnHeadersLabel=[];                   
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
            function groupedHorizontalBarChart(data){
               
                d3.selectAll("." + data.id).remove();
                
                svgP.append("p").attr("class", data.id).text(data.id);
                var svg = svgP
                .append("svg")
                .attr("class", "ghbchart " + data.id);
               
                var chartWidth       = 700,
                    barHeight        = 20,
                    groupHeight      = barHeight * data.series.length,
                    gapBetweenGroups = 10,
                    spaceForLabels   = 150,
                    spaceForLegend   = 200,
                    opacitydefault = 0.7,
                    opacityselected = 1.0,
                    opacitynotselected = 0.3,
                    marginbottom = 50;

                // Zip the series data together (first values, second values, etc.)
                var zippedData = [];
                for (var i=0; i<data.labels.length; i++) {
                  for (var j=0; j<data.series.length; j++) {
                    zippedData.push(Number(data.series[j].values[i]));

                  }
                }
                // Color scale
                //var color = d3.scale.category20();
                var d3colorR = d3.scale.category10().range();
                function getColor(d, i){
                  return data.colors !== undefined ? d3colorR[data.colors[i]] : d3colorR[i];
                }

                var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;

                var x = d3.scale.linear()
                    .domain([0, d3.max(zippedData)])
                    .range([0, chartWidth]);

                var y = d3.scale.linear()
                    .range([chartHeight + gapBetweenGroups, 0]);

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .tickFormat('')
                    .tickSize(0)
                    .orient("left");
                
                var zz = data.series.length -1;
                
                // Specify the chart area and dimensions
                //var chart = d3.select(".ghbchart")
                var chart = svg//d3.select("#" + data.series[zz].label)
                    //.attr("width", spaceForLabels + chartWidth + spaceForLegend)
                    .attr("width", "100%")
                    .attr("height", chartHeight + marginbottom);
                
                // Create bars
                var bar = chart.selectAll("g")
                    .data(zippedData)
                    .enter().append("g")
                    .attr("transform", function(d, i) {
                      return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i/data.series.length))) + ")";
                    });
                    
                // Create rectangles of the correct width
                bar.append("rect")
                    //.attr("fill", function(d,i) { return color(i % data.series.length); })
                    .attr("fill", function(d,i) { return getColor(d,i % data.series.length); })
                    .style("fill-opacity", opacitydefault)
                    .attr("class", function(d,i){ return "ghbbar"+data.id+(i % data.series.length);})
                    .attr("width", x)
                    .attr("height", barHeight - 1)
                     .on('mouseover', function (d, i){
                        mouseoverId = (data.id+"") + (i % data.series.length);
                        d3.selectAll("svg").selectAll("rect")
                        .transition(200)
                        .style("fill-opacity", opacitynotselected); 
                        d3.selectAll(".ghbbar"+mouseoverId)
                        .transition(200)
                        .style("fill-opacity", opacityselected);
                        d3.selectAll(".legendRect"+mouseoverId)
                        .transition(200)
                        .style("fill-opacity", opacityselected);

                    })
                    .on('mouseout', function (d, i){
                          d3.selectAll("svg").selectAll("rect")
                          .transition(200)
                          .style("fill-opacity",opacitydefault);
                    });

                // Add text label in bar
                bar.append("text")
                    .attr("x", function(d) { return x(d) - 3; })
                    .attr("y", barHeight / 2)
                    .attr("fill", "red")
                    .attr("dy", ".35em")
                    .text(function(d) { return d; });

                // Draw labels
                bar.append("text")
                    .attr("class", "label")
                    .attr("x", function(d) { return - 10; })
                    .attr("y", groupHeight / 2)
                    .attr("dy", ".35em")
                    .text(function(d,i) {
                      if (i % data.series.length === 0)
                        return data.labels[Math.floor(i/data.series.length)];
                      else
                        return "";});

                chart.append("g")
                      .attr("class", "y axis")
                      .attr("id", "ghbaxis")
                      .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups/2 + ")")
                      .call(yAxis);

                // Draw legend
                var legendRectSize = 18,
                    legendSpacing  = 4;
                var mouseoverId;
                var legend = chart.selectAll('.legend')
                    .data(data.series)
                    .enter()
                    .append('g')
                    .attr('transform', function (d, i) {
                        var height = legendRectSize + legendSpacing;
                        var offset = -gapBetweenGroups/2;
                        var horz = spaceForLabels + chartWidth + 60 + legendRectSize;
                        var vert = i * height - offset;
                        return 'translate(' + horz + ',' + vert + ')';
                    })
                    //.attr("class", function(d,i){ return "ghbbar"+(i % data.series.length);})
                    .on('mouseover', function (d, i){
                        mouseoverId = (data.id + "") + (i % data.series.length);
                        d3.selectAll("svg").selectAll("rect")
                        .transition(200)
                        .style("fill-opacity", opacitynotselected); 
                        d3.selectAll(".ghbbar"+mouseoverId)
                        .transition(200)
                        .style("fill-opacity", opacityselected);
                        d3.selectAll(".legendRect"+mouseoverId)
                        .transition(200)
                        .style("fill-opacity", opacityselected);

                    })
                    .on('mouseout', function (d, i){
                          d3.selectAll("svg").selectAll("rect")
                          .transition(200)
                          .style("fill-opacity",opacitydefault);
                    });

                legend.append('rect')
                    .attr('class', function(d,i){ return 'legendRect' + data.id+(i % data.series.length);})
                    .attr('width', legendRectSize)
                    .attr('height', legendRectSize)
                    .style("fill-opacity", opacitydefault)
                    .style('fill', function (d, i) { return getColor(d,i); /*return color(i);*/ })
                    .style('stroke', function (d, i) {return getColor(d,i); /*return color(i);*/ });

                legend.append('text')
                    .attr('class', 'legend')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing)
                    .text(function (d, i) { return data.legends[i]; });
            }
            scope.render = function() {

              if (scope.tableColumnHeadersLabel.length === 0) return;
              
              var dataValuesPerTable;
              for ( var k = 0; k < scope.datavalues.length; k++){
                
                dataValuesPerTable = scope.datavalues[k];
                var  dataseries= [];
                for ( var i = 0; i < dataValuesPerTable.length; i++){
                    var tvalues = [];
                    for ( var j = 0; j < dataValuesPerTable[i].length; j++){
                      if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralString")
                        tvalues[j] = dataValuesPerTable[i][j].specialization.value[0].string;
                      else if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralReal")
                        tvalues[j] = dataValuesPerTable[i][j].specialization.value[0].double;
                      else if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralInteger")
                        tvalues[j] = dataValuesPerTable[i][j].specialization.value[0].integer;
                    }
                    dataseries[i] = {values:tvalues};
                 }
                 var data = {
                  id:  scope.dataNames[k],
                  labels: scope.tableColumnHeadersLabel[k],
                  legends: scope.tableRowHeadersLabel[k],
                  colors: udcolors[k],
                  series: dataseries
                 };
              /* original datavar data = {
                  id: "id123",
                  labels: [
                    'resilience', 'maintainability', 'accessibility',
                    'uptime', 'functionality', 'impact'
                  ]
                  series: [
                    {
                      label: '2012',
                      values: [4, 8, 15, 16, 23, 42]
                    },
                    {
                      label: '2013',
                      values: [12, 43, 22, 11, 73, 25]
                    },
                    {
                      label: '2014',
                      values: [31, 28, 14, 8, 15, 21]
                    },]
                };*/
                groupedHorizontalBarChart(data);
               
              }//end of k
            }; 

 
            scope.$watch('datavalues', function(newVals, oldVals) {
                return scope.render();
            }, true);
            
            ElementService.getElement(scope.mmsEid, false, ws, version)
            .then(function(data) {
              var tableContains = [];
              var tableNames = [];
              var tableColumnHeadersLabel=[];
              var rowHeaders = [];

              for ( var k = 0; k < data.specialization.contains.length; k++ ){
                if ( data.specialization.contains[k].type ==="Table"){
                  if ( data.specialization.contains[k-1].sourceType==="text")
                    tableNames.push(data.specialization.contains[k-1].text.replace("<p>","").replace("</p>","").replace(" ", "")); //assume it is Paragraph
                  tableContains.push(data.specialization.contains[k]);
                  rowHeaders = [];
                  //assume first column is empty
                  for ( var kk = 1; kk < data.specialization.contains[k].header[0].length; kk++){
                    rowHeaders[kk-1] = data.specialization.contains[k].header[0][kk].content[0].text.replace("<p>","").replace("</p>","");
                  }  
                  tableColumnHeadersLabel.push(rowHeaders); //xxx, yyy, mass,cost, power in string
                }
              }
              var rowHeadersMmsEid = []; 
              var dataValuesMmmEid =[];
              var body;
              
              for ( k = 0; k < tableContains.length; k++){
                  body = tableContains[k].body;
                  for (var i = 0; i < body.length; i++ ){
                    rowHeadersMmsEid.push(body[i][0].content[0].source);
                    
                    for ( var j = 1; j < body[i].length; j++){
                      dataValuesMmmEid.push(body[i][j].content[0].source);
                  }
                }
              }
              
              ElementService.getElements(rowHeadersMmsEid, false, ws, version)
              .then(function(rowHeaders) {
                      ElementService.getElements(dataValuesMmmEid, false, ws, version)
                        .then(function(values) {
                        var dataTableValues = [];
                        var datavalues = [];
                        var startIndex = 0;
                        var counter = 0;
                        for (k = 0; k < tableContains.length; k++){
                          datavalues = [];
                          var valueLength = tableColumnHeadersLabel[k].length* tableContains[k].body.length;
                          for (i = 0; i < valueLength; i= i + tableColumnHeadersLabel[k].length){
                            var datarow =[];// new Array(tableColumnHeadersLabel[k].length);
                            for ( var j = 0; j < tableColumnHeadersLabel[k].length; j++){
                              datarow.push(values[counter++]); 
                            }
                            datavalues.push(datarow);
                          }
                          dataTableValues.push(datavalues);
                        }
                        var tableRowHeaders=[];
                        counter = 0;
                        var numOfRows, eachRowHeader;
                        for (i = 0; i < dataTableValues.length; i++){
                          numOfRows = dataTableValues[i].length;
                          eachRowHeader = [];
                          for (k = 0; k < numOfRows; k++){
                              eachRowHeader.push(rowHeaders[counter++].name);
                          }  
                          tableRowHeaders.push(eachRowHeader);
                        }
                        scope.dataNames = tableNames; //[]ss
                        scope.tableColumnHeadersLabel = tableColumnHeadersLabel; //[]
                        scope.datavalues = dataTableValues; //[][] - array
                        scope.tableRowHeadersLabel = tableRowHeaders;

                        scope.render();
                  });
              });
            }); //end of ElementService

    }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        mmsEid: '@',
        color: '@',
      },
      link: mmsChartLink
    }; //return
}



