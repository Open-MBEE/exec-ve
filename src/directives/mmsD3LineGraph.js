(function() {'use strict';
  angular.module('mms.directives')
    .directive('mmsLineGraph', ['TableService', '$window', '$q', mmsLineGraph]);

  /*
   * @ngdoc directive
   * @name mms.directive:mmsLineGraph
   * @restrict EA
   * @scope
   * @param {string} eid Element ID or comma separated IDs to table elements
   * @param {string[]=} seriesNames Manually label each series in the legend
   * @param {string=} xCol Manually specify X axis column (first column by default)
   * @param {string[]=} xCols Manually specify X axis columns (multi-table)
   * @param {string=} yCol Manually specify Y axis column (for single series tables)
   * @param {string[]=} yCols Manually specify Y axis columns (multi-series tables)
   * @param {string=} xLabel Manually specify X axis label (first X column header by default)
   * @param {string=} xLabelPos Specify X axis label position
   * @param {string=} yLabel Manually specify Y axis label (first Y column header by default)
   * @param {string=} yLabelPos Specify Y axis label position
   * @description
   * A directive for generating a D3 line graph from opaque tables.
   * Element text is used as caption. If element text is "$title", the table title
   * will be used instead. Use "{''}" to generate an empty caption.
   *
   * @example <caption>Example usage with a multi-series table.</caption>
   * // Generates a velocity vs. time graph with 2 time series and uses the table
   * // title as caption.
   * // '###' is the element ID of a table with columns:
   * // "Time (s)", "Velocity" and "Acceleration".
   * // The first column is assumed to be the x column, and its column header is
   * // used as the x-axis label by default.
   * <mms-line-graph data-eid="###" data-y-label="Velocity (m/s)">
   *  $title
   * </mms-line-graph>
   * @example <caption>Example usage with a multi-series table with distinct x-columns.</caption>
   * // Generates a velocity vs. time graph with 2 unaligned time series by explicitly
   * // specifying the x- and y-columns.
   * // '###' is the element ID of a table with columns:
   * // "Time1", "Time2", "Velocity1", "Acceleration1", "Velocity2", "Acceleration2"
   * <mms-line-graph data-eid="###" data-x-col="Time1"
   *  data-y-cols="['Velocity1','Velocity2']" data-x-label="Time (s)"
   *  data-y-label="Velocity (m/s)">
   *  $title
   * </mms-line-graph>
   * @example <caption>Example usage with multiple single-series tables.</caption>
   * // Generates a velocity-over-time graph with 4 time series and a caption
   * // '###' are the element IDs of tables with columns:
   * // "Acceleration (m/s^2), "Time (s)", "Velocity (m/s)"
   * // and:
   * // "Acceleration (m/s^2), "Time", "Velocity (m/s)"
   * <mms-line-graph data-eid="###,###,###,###" data-y-col="Velocity" data-x-cols="['Time (s)', 'Time']">
   *  Caption this!
   * </mms-line-graph>
   */
  function mmsLineGraph(TableService, $window, $q) {

    function mmsGraphLink(scope, element, attrs, mmsViewCtrl) {
      var d3 = $window.d3;
      var c3 = $window.c3;

      var ws = scope.mmsWs;
      var version = scope.mmsVersion;
      var promises = [];
      var eids = scope.eid.split(',');
      var xCols = [], yCols = [];

      // Initiate REST calls
      eids.forEach(function(eid) {
        promises.push(TableService.readTableCols(eid, ws, version));
      });

      // Get column settings
      if (scope.xCols) {
        xCols = scope.xCols;
      } else if (scope.xCol) {
        xCols.push(scope.xCol);
      }
      if (scope.yCols) {
        yCols = scope.yCols;
      } else if (scope.yCol) {
        yCols.push(scope.yCol);
      }

      // When REST calls return...
      $q.all(promises).then(function(values) {
        var sc = 0, // series count
        _chart = {  // C3 config
          data: {
            columns: [],
            names: {},
            order: 'asc'
          },
          axis: {
            x: {
              label : {}
            },
            y: {
              label : {}
            }
          }
        };
        if (values.length > 1) {
          _chart.data.xs = [];
        }

        // Process each table
        values.forEach(function(value, tc) {
          var xCol;

          // Determine x column for the table
          if (xCols.length > 0) {
            xCol = xCols[tc % xCols.length];
          } else {
            xCol = value.columnHeaders[0];
            xCols.push(xCol);
          }

          // Set chart title and universal x column (if only one is provided)
          if (tc === 0) {
            _chart.title = value.title;
            if (values.length === 1 && !scope.xCols) {
              _chart.data.x = xCol + tc;
            }
          }

          var isY = false,
              col,
              ci = value.columnHeaders.length - 1;

          while (ci >= 0) {
            col = value.columnHeaders[ci];
            if (col === xCol || (isY = (yCols.length === 0 || yCols.includes(col)))) {
              if (isY) {
                // assign name
                if (scope.seriesNames === undefined || scope.seriesNames[sc] === undefined) {
                  _chart.data.names[col + tc] = col;
                } else {
                  _chart.data.names[col + tc] = scope.seriesNames[scope.seriesNames.length - sc - 1];
                }
                // assign x column if more than one
                if (values.length > 1) {
                  _chart.data.xs[col + tc] = xCol + tc;
                }

                sc++;
                isY = false;
              }
              value.columns[ci].unshift(col + tc);
            } else {
              // unused column
              value.columnHeaders.splice(ci, 1);
              value.columns.splice(ci, 1);
            }
            ci -= 1;
          }

          _chart.data.columns = _chart.data.columns.concat(value.columns);
        });

        // label/position axes
        _chart.axis.x.label.text = scope.xLabel ? scope.xLabel : xCols[0];
        if (scope.xLabelPos) {
          _chart.axis.x.label.position = scope.xLabelPos;
        }
        _chart.axis.y.label.text = scope.yLabel ? scope.yLabel : yCols[0];
        if (scope.yLabelPos) {
          _chart.axis.y.label.position = scope.yLabelPos;
        }
        console.log(_chart);

        var chart = c3.generate(_chart);
        scope.caption = element.text();
        // $title hack is necessary because tinyMCE strips out empty tags
        scope.caption = (scope.caption === '$title')? _chart.title : scope.caption;
        element.text('');
        var fig = $('<figure><figcaption>' + scope.caption + '</figcaption></figure>').appendTo(element).append(chart.element);
      });
    }

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        eid: '@',
        xCol: '@',
        xCols: '=',
        yCol: '@',
        yCols: '=',
        xLabel: '@',
        xLabelPos: '@',
        yLabel: '@',
        yLabelPos: '@',
        seriesNames: '='
      },
      link: mmsGraphLink
    };
  }
})();
