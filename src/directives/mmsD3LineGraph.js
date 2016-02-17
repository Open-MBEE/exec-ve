(function() {'use strict';
  angular.module('mms.directives')
    .directive('mmsLineGraph', ['TableService', '$window', mmsLineGraph]);

  /*
   * @ngdoc directive
   * @name mms.directive:mmsLineGraph
   * @restrict EA
   * @description
   * A directive for generating a D3 line graph from opaque tables
   *
   * @example <caption>Example usage with a multi-series table.</caption>
   * // Generates a velocity-over-time graph with 2 time series and a caption
   * // '###' is the element ID of a table with columns: "Time", "Velocity1", "Velocity2"
   * <mms-line-graph data-eid="###" data-multi-series="true" data-x-label="Time (s)" data-y-label="Velcity (m/s)">
   *  Caption this!
   * </mms-line-graph>
   * @example <caption>Example usage with multiple single series tables.</caption>
   * // Generates a velocity-over-time graph with 4 time series and a caption
   * // '###' are the element IDs of tables with columns: "Acceleration (m/s^2), "Time (s)",
   * // "Velocity (m/s)" and the corresponding property names: a, t, v
   * <mms-line-graph data-eid="###,###,###,###" data-y-col="v" data-x-col="t">
   *  Caption this!
   * </mms-line-graph>
   */
  function mmsLineGraph(TableService, $window) {

    function mmsGraphLink(scope, element, attrs, mmsViewCtrl) {
      console.log('mmsGraphLink()');
      var d3 = $window.d3;
      var c3 = $window.c3;

      var ws = scope.mmsWs;
      var version = scope.mmsVersion;

      //if (scope.yColumn)
      // Multiple series in a single table
      TableService.readTableCols(scope.eid, ws, version).then(function(value) {
        console.log(value);

        var xCol = (scope.xCol !== undefined ? scope.xCol : value.columnKeys[0]);
        var _chart = {
          data: {
            columns: value.columns,
            names: {},
            x: xCol
          }
        };

        if (scope.seriesNames !== undefined) {
          scope.seriesNames = scope.seriesNames.split(/\s*[,|]\s*/);
          console.log(value.columnKeys);
          console.log(scope.seriesNames);
        }
        var j = 0;
        value.columnKeys.forEach(function(key, i) {
          _chart.data.columns[i].unshift(key);
          if (key !== xCol) {
            if (scope.seriesNames === undefined) {
              _chart.data.names[key] = value.columnHeaders[i];
            } else {
              _chart.data.names[key] = scope.seriesNames[j++];
            }
          }
        });

        console.log(_chart);

        var chart = c3.generate(_chart);
        $(element).text('');
        $(element).append('<h2>' + value.title + '</h2>');
        var fig = $('<figure><figcaption>' + element.text() + '</figcaption></figure>').appendTo(element).append(chart.element);
      });
    }

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        eid: '@',
        xCol: '@',
        yCol: '@',
        xLabel: '@',
        yLabel: '@',
        seriesNames: '@',
        multiSeries: '@'
      },
      link: mmsGraphLink
    };
  }
})();
