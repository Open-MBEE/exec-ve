import { veComponents } from '@ve-components';

veComponents.directive('mmsD3NormalizedStackedBarPlot', ['PlotService', '$window', mmsD3NormalizedStackedBarPlot]);

/**
  /* reference https://bl.ocks.org/mbostock/3886394
  */
function mmsD3NormalizedStackedBarPlot(PlotService, $window) {
    const mmsChartLink = function (scope, element, attrs, mmsViewCtrl) {
        const d3 = $window.d3;

        const divchart = d3.select(element[0]).append('div');
        //default
        const defaultPlotConfig = {
            width: 960 /*parseInt(divchart.style("width"))*0.95*/,
            height: 500,
            marginTop: 20,
            marginRight: 60,
            marginBottom: 30,
            marginLeft: 40,
        };
        const plotId = 'd3nbplot' + scope.$id;

        let projectId, refId, commitId;
        if (mmsViewCtrl) {
            const viewVersion = mmsViewCtrl.getElementOrigin();
            projectId = viewVersion.projectId;
            refId = viewVersion.refId;
            commitId = viewVersion.commitId;
        }

        function vf_pplot() {
            divchart.selectAll('*').remove();
            divchart.attr('id', plotId);
            const svg = divchart.append('svg:svg');

            const plotConfig = PlotService.plotConfig(scope.plot.config.options, defaultPlotConfig);
            svg.attr('width', plotConfig.width);
            svg.attr('height', plotConfig.height);
            const margin = {
                    top: plotConfig.marginTop,
                    right: plotConfig.marginRight,
                    bottom: plotConfig.marginBottom,
                    left: plotConfig.marginLeft,
                },
                width = +svg.attr('width') - margin.left - margin.right,
                height = +svg.attr('height') - margin.top - margin.bottom,
                g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            const x = d3.scaleBand().rangeRound([0, width]).padding(0.1).align(0.1);

            const y = d3.scaleLinear().rangeRound([height, 0]);

            const z = d3.scaleOrdinal(d3.schemeCategory10);

            const stack = d3.stack().offset(d3.stackOffsetExpand);

            let data = scope.tablebody.c3_data;
            data = total(data);
            data.sort(function (a, b) {
                return b[scope.tablecolumnheader[0]] / b.total - a[scope.tablecolumnheader[0]] / a.total;
            });

            x.domain(
                data.map(function (d) {
                    return d.rowheader;
                })
            );
            z.domain(scope.tablecolumnheader);

            const serie = g
                .selectAll('.serie')
                .data(stack.keys(scope.tablecolumnheader)(data))
                .enter()
                .append('g')
                .attr('class', 'serie')
                .attr('fill', function (d) {
                    return z(d.key);
                });

            serie
                .selectAll('rect')
                .data(function (d) {
                    return d;
                })
                .enter()
                .append('rect')
                .attr('x', function (d) {
                    return x(d.data.rowheader);
                })
                .attr('y', function (d) {
                    return y(d[1]);
                })
                .attr('height', function (d) {
                    return y(d[0]) - y(d[1]);
                })
                .attr('width', x.bandwidth());

            g.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', 'translate(0,' + height + ')')
                .call(d3.axisBottom(x));

            g.append('g').attr('class', 'axis axis--y').call(d3.axisLeft(y).ticks(10, '%'));

            const legend = serie
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function (d) {
                    d = d[d.length - 1];
                    return 'translate(' + (x(d.data.rowheader) + x.bandwidth()) + ',' + (y(d[0]) + y(d[1])) / 2 + ')';
                });

            legend.append('line').attr('x1', -6).attr('x2', 6).attr('stroke', '#000');

            legend
                .append('text')
                .attr('x', 9)
                .attr('dy', '0.35em')
                .attr('fill', '#000')
                .style('font', '10px sans-serif')
                .text(function (d) {
                    return d.key;
                });
        }

        //add total in original row array.
        function total(all) {
            all.forEach(function (a) {
                a.total = 0;
                for (let i = 0; i < scope.tablecolumnheader.length; i++) {
                    a.total += Number(a[scope.tablecolumnheader[i]]);
                }
            });
            return all;
        }

        scope.render = function () {
            PlotService.readValues2(scope.plot, projectId, refId, commitId).then(function (value) {
                scope.tablebody = value.tablebody;
                scope.tablecolumnheader = value.tableheader;
                scope.valuesO = value.tablebody.valuesO; //value objects used in watch
                if (scope.tablebody.c3_data.length === 0) {
                    //no data
                    return;
                }
                vf_pplot();
            }); //end of PlotService
        }; //end of render

        scope.$watch(
            'valuesO',
            function (newVals, oldVals) {
                return scope.render();
            },
            true
        );
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
