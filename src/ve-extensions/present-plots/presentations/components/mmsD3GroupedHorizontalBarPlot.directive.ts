import { veComponents } from '@ve-components';
//d3js grouped horizontal bar chart is created by referencing
//http://bl.ocks.org/erikvullings/51cc5332439939f1f292

veComponents.directive('mmsD3GroupedHorizontalBarPlot', ['PlotService', '$window', mmsD3GroupedHorizontalBarPlot]);
function mmsD3GroupedHorizontalBarPlot(PlotService, $window) {
    const mmsChartLink = function (scope, element, attrs, mmsViewCtrl) {
        const d3 = $window.d3;
        const divchart = d3.select(element[0]).append('div');
        const defaultPlotConfig = {
            width: 960,
            marginTop: 20,
            marginRight: 40,
            marginBottom: 30,
            marginLeft: 40,
        };
        const plotConfig = PlotService.plotConfig(scope.plot.config.options, defaultPlotConfig);
        let achartdata;
        element.click(function (e) {
            //stop Propogating event to parent(transclude-doc) element.
            e.stopPropagation();
        });

        const d3colorR = d3.scaleOrdinal(d3.schemeCategory10).range();
        function getColor(data, i) {
            return data.colors !== undefined ? d3colorR[data.colors[i]] : d3colorR[i];
        }
        let projectId;
        let refId;
        let commitId;

        if (mmsViewCtrl) {
            const viewVersion = mmsViewCtrl.getElementOrigin();
            projectId = viewVersion.projectId;
            refId = viewVersion.refId;
            commitId = viewVersion.commitId;
        }
        const opacitydefault = 1, //0.7,
            opacityselected = 1.0,
            opacitynotselected = 0.3;

        function mouseout() {
            d3.selectAll('.ghbbar').transition(200).style('fill-opacity', opacitydefault);

            d3.selectAll('.legendRect').transition(200).style('fill-opacity', opacitydefault);

            d3.selectAll('.legentFilter').transition(200).style('opacity', opacitydefault);
        } //end of function mouseout

        function mouseover(mouseoverClassId) {
            d3.selectAll('.ghbbar').transition(200).style('fill-opacity', opacitynotselected);

            d3.selectAll('.legendRect').transition(200).style('fill-opacity', opacitynotselected);

            d3.selectAll('.legentFilter').transition(200).style('opacity', opacitynotselected);

            d3.selectAll(mouseoverClassId).transition(200).style('fill-opacity', opacityselected);

            d3.selectAll(mouseoverClassId).transition(200).style('opacity', opacityselected);
        } //end of function mouseover

        function createFilters(data) {
            //create only one filter display
            const graphFilter = divchart
                .append('div')
                .attr('class', 'graphFilter ' + data.id)
                .style('margin-left', plotConfig.marginLeft + 'px');
            const filterLegendsDiv = graphFilter
                .append('div')
                .append('label')
                .style('border', '1px solid #ddd')
                .text('Filter by Legends');
            filterLegendsDiv
                .selectAll('div')
                .data(data.legends)
                .enter()
                .append('div')
                .attr('class', function (d, i) {
                    return 'legentFilter ' + data.id + ' ' + PlotService.toValidId(d);
                })
                .attr('style', function (d, i) {
                    return 'opacity: ' + opacitydefault + ';background-color:' + getColor(data, i) + ';';
                })
                .on('mouseover', (d, i) => {
                    mouseover('.' + data.id + '.' + PlotService.toValidId(d));
                })
                .on('mouseout', (d, i) => {
                    mouseout();
                })
                .append('label')
                .each((d, i) => {
                    // create checkbox for each data
                    d3.select(this)
                        .append('input')
                        .attr('type', 'checkbox')
                        .attr('checked', function (d, i) {
                            if (data.legendsFilter[PlotService.toValidId(d)] === true) return true;
                            else return null;
                        })
                        .attr('style', function (d, i) {
                            const color = getColor(data, i);
                            return 'color: ' + color + ';background-color:' + color + ';';
                        })
                        .on('click', (d) => {
                            // filter by legends
                            data.legendsFilter[PlotService.toValidId(d)] = this.checked;
                            createGroupedHorizontalBarChart(achartdata);
                            createFilters(achartdata);
                        });
                    d3.select(this)
                        .append('span')
                        .text((d) => {
                            return d;
                        });
                });
            const filterColoumnsDiv = graphFilter
                .append('div')
                .append('label')
                .style('border', '1px solid #ddd')
                .text('Filter by Columns');
            filterColoumnsDiv
                .selectAll('div')
                .data(data.labels)
                .enter()
                .append('div')
                .attr('class', function (d, i) {
                    return 'columnfilter ' + data.id + ' ' + PlotService.toValidId(d);
                })
                .on('mouseover', function (d, i) {
                    mouseover('.' + data.id + '.' + PlotService.toValidId(d));
                })
                .on('mouseout', function (d, i) {
                    mouseout();
                })
                .append('label')
                .each((d, i) => {
                    // create checkbox for each data
                    d3.select(this)
                        .append('input')
                        .attr('type', 'checkbox')
                        .attr('checked', function (d, i) {
                            if (data.labelsFilter[PlotService.toValidId(d)] === true) return true;
                            else return null;
                        })
                        .on('click', (d) => {
                            //filter by columns(labels)
                            data.labelsFilter[PlotService.toValidId(d)] = this.checked;
                            createGroupedHorizontalBarChart(achartdata); //2nd argument is not used
                            createFilters(achartdata);
                        });
                    d3.select(this)
                        .append('span')
                        .text((d) => {
                            return d;
                        });
                });
        } //end of function createFilter

        function createGroupedHorizontalBarChart(data) {
            divchart.selectAll('*').remove();
            divchart.attr('class', achartdata.id).attr('style', 'border:1px solid #ddd');

            const svg = divchart.append('svg:svg').attr('class', 'ghbchart ' + data.id);

            const filteredDataValues: any[] = [];
            const filteredDataSysmlids: any[] = [];
            const filteredDataColors: any[] = [];
            const filteredDataLegends: any[] = []; //table row headers
            const filteredDataLabels: any[] = []; //table column headers
            const datalegendsfilter: any[] = data.legendsFilter;
            const datalabelsfilter: any[] = data.labelsFilter;
            let counter = -1;

            for (let i = 0; i < data.labels.length; i++) {
                if (datalabelsfilter[PlotService.toValidId(data.labels[i])]) {
                    filteredDataLabels.push(data.labels[i]);
                    for (let j = 0; j < data.values.length; j++) {
                        //data.values.length == data.legends.length
                        counter++;
                        if (datalegendsfilter[PlotService.toValidId(data.legends[j])]) {
                            filteredDataValues.push(Number(data.values[j][i]));
                            filteredDataSysmlids.push(data.valueIds[j][i]);
                            filteredDataColors.push(getColor(data, counter % data.legends.length));
                            filteredDataLegends.push(PlotService.toValidId(data.legends[j]));
                        }
                    }
                }
            }
            const filteredLegendsLength = filteredDataLegends.length / filteredDataLabels.length;

            const chartWidth = plotConfig.width - 260,
                barHeight = 20,
                groupHeight = barHeight * filteredLegendsLength,
                gapBetweenGroups = 10,
                spaceForLabels = plotConfig.marginLeft,
                spaceForLegend = 200,
                marginbottom = 50;
            const chartHeight = barHeight * filteredDataValues.length + gapBetweenGroups * filteredDataLabels.length;

            const x = d3
                .scaleLinear() //d3.scale.linear()
                .domain([0, d3.max(filteredDataValues)])
                .range([0, chartWidth]);

            const y = d3
                .scaleLinear() //d3.scale.linear()
                .range([chartHeight + gapBetweenGroups, 0]);

            const yAxis = d3
                .axisLeft(y) //d3.svg.axis()
                .tickFormat('')
                .tickSize(0);

            // Specify the chart area and dimensions
            const chart = svg.attr('width', plotConfig.width).attr('height', chartHeight + marginbottom);

            // Create bars
            const bar = chart
                .selectAll('g')
                .data(filteredDataValues)
                .enter()
                .append('g')
                .attr('transform', function (d, i) {
                    return (
                        'translate(' +
                        spaceForLabels +
                        ',' +
                        (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i / filteredLegendsLength))) +
                        ')'
                    );
                });
            const numRows = filteredDataLegends.length / filteredDataLabels.length;
            // Create rectangles of the correct width
            bar.append('rect')
                .attr('id', function (d, i) {
                    return filteredDataSysmlids[i];
                })
                .attr('fill', function (d, i) {
                    return filteredDataColors[i];
                })
                .style('fill-opacity', opacitydefault)
                .attr('class', function (d, i) {
                    return (
                        'ghbbar ' +
                        data.id +
                        ' ' +
                        filteredDataLegends[i] +
                        ' ' +
                        PlotService.toValidId(filteredDataLabels[Math.floor(i / numRows)])
                    );
                })
                .attr('width', x)
                .attr('height', barHeight - 1)
                .on('click', function (d, i) {
                    if (mmsViewCtrl) mmsViewCtrl.transcludeClicked(this.id);
                })
                .on('mouseover', function (d, i) {
                    mouseover('.' + data.id + '.' + filteredDataLegends[i]);
                })
                .on('mouseout', function (d, i) {
                    mouseout();
                });
            // Add text label in bar
            bar.append('text')
                .attr('class', function (d, i) {
                    return 'ghbbar ' + data.id + ' ' + filteredDataLegends[i];
                })
                .attr('x', function (d) {
                    return x(d) - 3;
                })
                .attr('y', barHeight / 2)
                .attr('dy', '.35em')
                .text(function (d) {
                    return d;
                });

            //left side label
            bar.each(function (d, i) {
                if (i % filteredLegendsLength === 0) {
                    d3.select(this)
                        .append('text')
                        .attr('class', 'label')
                        .attr('x', function (d) {
                            return -10;
                        })
                        .attr('y', groupHeight / 2)
                        .attr('dy', '.35em')
                        .text(filteredDataLabels[Math.floor(i / filteredLegendsLength)]);
                }
            });
            chart
                .append('g')
                .attr('class', 'y axis')
                .attr('id', 'ghbaxis')
                .attr('transform', 'translate(' + spaceForLabels + ', ' + -gapBetweenGroups / 2 + ')')
                .call(yAxis);

            // Draw legend
            const legendRectSize = 18,
                legendSpacing = 4;
            let mouseoverId;
            const legend = chart
                .selectAll('.legend')
                .data(data.legends)
                .enter()
                .append('g')
                .attr('transform', (d, i) => {
                    const height = legendRectSize + legendSpacing;
                    const offset = -gapBetweenGroups / 2;
                    const horz = spaceForLabels + chartWidth + 60 + legendRectSize;
                    const vert = i * height - offset;
                    return 'translate(' + horz + ',' + vert + ')';
                })
                .on('mouseover', function (d, i) {
                    mouseover('.' + data.id + '.' + PlotService.toValidId(d));
                })
                .on('mouseout', function (d, i) {
                    mouseout();
                });

            legend
                .append('rect')
                .attr('class', function (d, i) {
                    return 'legendRect ' + data.id + ' ' + PlotService.toValidId(d);
                })
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill-opacity', opacitydefault)
                .style('fill', (d, i) => {
                    return getColor(data, i); /*return color(i);*/
                })
                .style('stroke', (d, i) => {
                    return getColor(data, i); /*return color(i);*/
                });

            legend
                .append('text')
                .attr('class', 'legend')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text((d, i) => {
                    return d;
                });
        }
        scope.render = function () {
            PlotService.readValues(scope.plot, projectId, refId, commitId).then(function (value) {
                const tablebody = value.tablebody;
                const tableheader = value.tableheader;
                //scope.isHeader = value.isHeader;
                scope.valuesO = value.tablebody.valuesO; //value objects used in watch
                if (tablebody.c3_data.length === 0) {
                    //no data
                    return;
                }
                let udcolors;
                if (scope.plot.config.colors !== undefined) {
                    udcolors = scope.plot.config.colors;
                }
                const rowvalues: number[] = [];
                const cellIds: number[] = []; //0, 1, 2, 3
                const legends: any[] = [];
                const legendsFilter: boolean[] = [];
                let rowvalue: number[];
                let cellId: number[];
                let cid = 0;
                tablebody.c3_data.forEach(function (row) {
                    legends.push(row[0]);
                    legendsFilter[row[0]] = true;
                    rowvalue = []; //reset
                    cellId = []; //reset
                    for (let i = 1; i < row.length; i++) {
                        rowvalue.push(row[i]);
                        cellId.push(cid++);
                    }
                    cellIds.push(...cellId);
                    rowvalues.push(...rowvalue);
                });
                const labelsFilter: { [key: string]: boolean } = {};
                tableheader.forEach(function (item) {
                    labelsFilter[item] = true;
                });
                achartdata = {
                    id: '_' + scope.$id,
                    labels: tableheader,
                    legends: legends, //row headers
                    colors: udcolors,
                    values: rowvalues, //table body without row headers
                    valueIds: cellIds,
                    legendsFilter: legendsFilter,
                    labelsFilter: labelsFilter,
                };
                createGroupedHorizontalBarChart(achartdata);
                createFilters(achartdata);
            });
        }; //end of render
        scope.$watch(
            'valuesO',
            function (newValue, oldValue) {
                return scope.render();
            },
            true
        );

        //rect bar is clicked or table cell (Except rowHeaders) is clicked
        // eventSvc.$on('element.selected', function(data) {
        //     d3.selectAll("rect").transition(200).style("fill-opacity", opacitynotselected);
        // });
    }; //end of link

    return {
        restrict: 'EA',
        require: '?^view',
        scope: {
            plot: '<',
        },
        link: mmsChartLink,
    }; //return
}
