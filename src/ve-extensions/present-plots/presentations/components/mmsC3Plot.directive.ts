import { veComponents } from '@ve-components';

veComponents.directive('mmsC3Plot', ['PlotService', '$window', mmsC3Plot]);
function mmsC3Plot(PlotService, $window, _) {
    const mmsChartLink = function (scope, element, attrs, mmsViewCtrl) {
        const c3 = $window.c3;
        const d3 = $window.d3;
        const divchart = d3.select(element[0]).append('div');

        let projectId;
        let refId;
        let commitId;

        if (mmsViewCtrl) {
            const viewVersion = mmsViewCtrl.getElementOrigin();
            projectId = viewVersion.projectId;
            refId = viewVersion.refId;
            commitId = viewVersion.commitId;
        }

        /**
         * for any value that's not an object, assume it's a function string,
         * eval it and assign to same key
         * @param {*} object
         */
        function simplifyFunctions(object) {
            _.forOwn(object, function (value, key, ob) {
                if (_.isPlainObject(value)) {
                    simplifyFunctions(value);
                } else {
                    ob[key] = eval('(' + value + ')');
                }
            });
        }

        function vf_pplot(c3json, c3jfunc) {
            if (c3jfunc && _.isPlainObject(c3jfunc)) {
                simplifyFunctions(c3jfunc);
                _.merge(c3json, c3jfunc);
            }
            c3.generate(c3json);
        }

        scope.render = function () {
            PlotService.readValues(scope.plot, projectId, refId, commitId).then(function (value) {
                scope.valuesO = value.tablebody.valuesO; //value objects used in watch
                let c3options;
                if (value.tablebody.c3_data.length === 0) {
                    //no data
                    return;
                }
                if (scope.plot.config.options === undefined || scope.plot.config.options.length === 0) {
                    if (value.isHeader)
                        c3options = {
                            data: { x: 'x', type: 'line' },
                            axis: { x: { type: 'category', tick: { centered: true } } },
                        };
                    else c3options = { data: {} };
                } else c3options = scope.plot.config.options;
                if (
                    value.tablebody.c3_data.length === scope.plot.table.body.length &&
                    c3options.data.xs === undefined &&
                    value.isHeader
                ) {
                    value.tablebody.c3_data.unshift(['x'].concat(value.tableheader));
                }
                c3options.data.columns = value.tablebody.c3_data;

                let c3jfunc;
                if (scope.plot.config.functions) {
                    c3jfunc = scope.plot.config.functions;
                }
                divchart.selectAll('*').remove();
                divchart.attr('id', 'c3chart' + scope.$id);
                c3options.bindto = '#c3chart' + scope.$id;

                vf_pplot(c3options, c3jfunc);
            });
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
