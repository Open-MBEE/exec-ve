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
   * @param {string|number|boolean=false} logScale Desired base of the logarithmic scale to use. Put "e" in quotes.
   * @param {boolean=true} logScaleLabel Whether to render labels for log grid
   * @param {string=="line"} type Type of graph to render (line, spline, step, area, area-spline, area-step, ...)
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
   *
   * @TODO: Add data types support (spline, area-spline, area-line, etc.)
   * @TODO: Find way to avoid using onrendered callback for log scale
   */
  function mmsLineGraph(TableService, $window, $q) {

    var graphCount = 0;
    var DEFAULT = {
      LOG_GRID_SUBDIVS: 9,
      SVG_SUP: {
        open: '<tspan dy="-.5em" font-size="75%">',
        close: '</tspan>'
      },
      SVG_CONTAINER: {
        open: '<figure id="$id">',
        close: '</figure>'
      },
      SVG_CAPTION: {
        open: '<figcaption>',
        close: '</figcaption>'
      }
    };

    function wrapTag(tag, text, attrs) {
      var attrExpanded = '';
      if (attrs !== undefined) {
        for (var attr in attrs) {
          attrExpanded += ' ' + attr + '="' + attrs[attr] + '"';
        }
      }
      return tag.open.replace('>', attrExpanded + '>') + text + tag.close;
    }

    var sup = wrapTag.bind({}, DEFAULT.SVG_SUP);
    var figure = wrapTag.bind({}, DEFAULT.SVG_CONTAINER);
    var figCaption = wrapTag.bind({}, DEFAULT.SVG_CAPTION);

    function generateGraphSettings(scope) {
      var deferred = $q.defer();

      var ws = scope.mmsWs;
      var version = scope.mmsVersion;
      var promises = [];
      var eids = scope.eid.split(',');
      var xCols = [], yCols = [];

      // Generate figure element's ID
      scope.figId = 'LineGraph' + graphCount++;

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
              label : {},
              tick : {}
            },
            y: {
              label : {}
            }
          }
        };
        if (values.length > 1) {
          _chart.data.xs = {};
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
              ci = value.columnHeaders.length - 1,
              yColKeys = [],  // this table's y column keys
              _sc = 0;        // this table's series counter

          // Process columns in reverse to mutate while looping
          while (ci >= 0) {
            col = value.columnHeaders[ci];
            if (col === xCol || (isY = (yCols.length === 0 || yCols.includes(col)))) {
              if (isY) {
                // assign x column if more than one
                if (values.length > 1) {
                  _chart.data.xs[col + tc] = xCol + tc;
                }
                yColKeys.push(col + tc);
                isY = false;
              }
              // Prepend data columns with column key
              value.columns[ci].unshift(col + tc);
            } else {
              // Remove unused column
              value.columnHeaders.splice(ci, 1);
              value.columns.splice(ci, 1);
            }
            ci -= 1;
          }

          // Name the y columns in order
          value.columns.forEach(function(column) {
            if (yColKeys.includes(column[0])) {
              if (scope.seriesNames === undefined || scope.seriesNames[sc] === undefined) {
                _chart.data.names[column[0]] = column[0];
              } else {
                _chart.data.names[column[0]] = scope.seriesNames[sc + _sc];
                _sc++;
              }
            }
          });
          sc += yColKeys.length;

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

        // Graph types
        if (scope.type) {
          _chart.data.type = scope.type;
        } else if (scope.types) {
          _chart.data.types = scope.types;
        }

        // console.log(_chart);
        deferred.resolve(_chart);
      });

      return deferred.promise;
    }

    function renderGraph(scope, element, _chart) {
      var html;
      scope.chart = c3.generate(_chart);
      scope.caption = element.text();
      // $title hack is necessary because tinyMCE strips out empty tags
      scope.caption = (scope.caption.trim() === '$title')? _chart.title : scope.caption;
      element.text('');
      html = figure(figCaption(scope.caption), {id: scope.figId});
      scope.fig = $(html).appendTo(element).append(scope.chart.element);
    }

    // @TODO: Add support for Y log scale
    function makeLogScale(scope, element, _chart) {
      var logFn, powFn, logBase;

      _chart.axis.x.tick.fit = true;

      // @TODO: Fix decimal rounding
      function logCustom(base, x) {
        return Math.log(x) / Math.log(base);
      }

      // Choose log function
      // @TODO: Add log1p and log2 support
      if (typeof scope.logScale === 'string' && scope.logScale.toLowerCase() === 'e') {
        logFn = Math.log;
        powFn = Math.exp;
        logBase = Math.E;
      } else if (typeof scope.logScale === 'number') {
        logBase = scope.logScale;
        if (logBase === 10) {
          logFn = Math.log10;
        } else if (logBase === 2) {
          logFn = Math.log2;
        } else {
          logFn = logCustom.bind({}, logBase);
        }
        powFn = Math.pow.bind({}, logBase);
      }

      // Format ticks and add grid lines
      var firstRender = true;
      _chart.onrendered = function() {
        if (firstRender) {
          firstRender = false;
          // Add grid lines
          scope.chart.xgrids.add(logGrid(scope.chart, scope.logScale, this.xAxis.tickValues(), 'log-grid'));
          $(this.axes.x[0]).find('.tick>text>tspan').html(function(i, power) {
            // @TODO: Refactor SVG exponent/superscript rendering
            return scope.logScale + sup(power);
          });
        }
      };

      // identify x columns
      var xs = [];
      if (_chart.data.xs) {
        xs = _.map(_chart.data.xs);
      } else {
        xs.push(_chart.data.x);
      }
      // Convert x values to log values
      _chart.data.columns.forEach(function(column) {
        var i;
        if (xs.includes(column[0])) {
          for (i = 1; i < column.length; i++) {
            column[i] = logFn(column[i]);
          }
        }
      });

      function logGrid(chart, logScale, ticks, className) {
        var powLast, grids = [];
        // Passing undefined to logGridLine() will use the position value
        var gridLabel = (scope.logScaleLabel === false ? '' : undefined);

        // Generate grid lines
        ticks.forEach(function(power, i) {
          if (i > 0) {
            // Between ticks
            grids = grids.concat(logGridSect(logFn, powFn, DEFAULT.LOG_GRID_SUBDIVS, powLast, power));
          }
          powLast = power;
        });
        // Last line
        grids.push(logGridLine(powFn(ticks[ticks.length - 1]), className, gridLabel));
        // console.log(grids);

        function logGridSect(logFn, powFn, num, powStart, powEnd) {
          var grids = [], grid;
          var diff, gridInt, gridPos, startTick, endTick;
          startTick = powFn(powStart);
          endTick = powFn(powEnd);
          diff = endTick - startTick;
          gridInt = diff / num;
          // console.log("Draw lines from pow("+powStart+")/"+startTick+" to pow("+powEnd+")/"+endTick);
          // console.log("diff: " + diff);
          // console.log("tickInt: " + tickInt);
          for (gridPos = startTick; gridPos < endTick; gridPos += gridInt) {
            grids.push(logGridLine(gridPos, className, gridLabel));
          }
          return grids;
        }

        /**
         * Generate a config object for a log gridline
         * @param {number} @pos Position/value of gridline
         */
        function logGridLine(pos, className, text) {
          var posLog = logFn(pos);
          return {
            value: posLog,
            text:  (typeof text === 'undefined') ? pos : text,
            class: className
          };
        }

        return grids;
      }
    }


    function mmsGraphLink(scope, element, attrs, mmsViewCtrl) {
      var d3 = $window.d3;
      var c3 = $window.c3;

      generateGraphSettings(scope).then(function(_chart) {
        // Handle logarithmic scales
        if (scope.logScale) {
          makeLogScale(scope, element, _chart);
        }
        renderGraph(scope, element, _chart);
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
        seriesNames: '=',
        logScale: '=',
        logScaleLabel: '=',
        type: '@',
        types: '='
      },
      link: mmsGraphLink
    };
  }
})();
