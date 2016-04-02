(function() {
  'use strict';
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
   * @param {string|number=} logScale Logarithmic scale base to use on both axes. Put "e" in quotes.
   * @param {string|number=} logScaleX Logarithmic scale base to use on X axis.
   * @param {string|number=} logScaleX Logarithmic scale base to use on Y axis.
   * @param {boolean=true} logScaleLabel Whether to render labels for log grid
   * @param {string=="line"} type Type of graph to render (line, spline, step, step-before, step-after, area, area-spline, area-step, ...).
   * @param {object=} padding Set the top/right/bottom/left margin.
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
        open: '<figure class="line-graph">',
        close: '</figure>'
      },
      SVG_CAPTION: {
        open: '<figcaption>',
        close: '</figcaption>'
      },
      GRAPH_MARGIN: 1,
      GRAPH_MARGIN_CROP: 0.2,
      LOGSCALE_MIN: 0.0001  // Convert 0 values to this number to avoid -Infinity
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

    function getUnit(label) {
      var res = label.match(/\((.+)\)/);
      if (res) {
        return ' ' + res[1];
      }
      return '';
    }

    var unitX = '', unitY = '';
    var xs, ys,                         // column keys
      xComps, yComps,                   // key-data composites
      xData, yData,                     // column data
      xColHeads, yColHeads;             // column headers

    /**
     * Generate C3 configurations for the table
     */
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

      // Collect column settings
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
      $q.all(promises).then(function(tables) {
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
              tick : {
                fit: false
              },
            },
            y: {
              label : {},
              tick : {
                fit: false
              }
            }
          },
          line: {},
          tooltip: {
            format: {}
          },
          _onrendered: [],
          _postrender: []
        };
        if (tables.length > 1) {
          _chart.data.xs = {};
        }
        if (typeof scope.tickFit === 'string') {
          _chart.axis.x.tick.fit = scope.tickFit.toLowerCase().indexOf('x') >= 0;
          _chart.axis.y.tick.fit = scope.tickFit.toLowerCase().indexOf('y') >= 0;
        }

        // Process each table
        tables.forEach(function(table, tc) {
          var xCol;

          // Determine x column for the table
          if (xCols.length > 0) {
            xCol = xCols[tc % xCols.length];
          } else {
            xCol = table.columnHeaders[0];
            xCols.push(xCol);
          }

          // Set chart title and universal x column (if only one is provided)
          if (tc === 0) {
            _chart.title = table.title;
            if (tables.length === 1 && !scope.xCols) {
              _chart.data.x = xCol + tc;
            }
          }

          var isY = false,
              col,
              ci = table.columnHeaders.length - 1,
              yColKeys = [],  // this table's y column keys
              _sc = 0,        // this table's series counter
              ck;             // temporary colKey

          // Process columns in reverse to mutate while looping
          xColHeads = [];
          yColHeads = [];
          while (ci >= 0) {
            col = table.columnHeaders[ci];
            ck = col + tc;
            if (col === xCol || (isY = (yCols.length === 0 || yCols.includes(col)))) {
              if (isY) {
                // assign x column if more than one
                if (tables.length > 1) {
                  _chart.data.xs[ck] = xCol + tc;
                }
                yColHeads.push(col);
                yColKeys.push(ck);
                isY = false;
              } else {
                xColHeads.push(col);
              }
              // Prepend data columns with column key
              table.columns[ci].unshift(ck);
            } else {
              // Remove unused column
              table.columnHeaders.splice(ci, 1);
              table.columns.splice(ci, 1);
            }
            ci -= 1;
          }

          // Name the y columns in order
          var yci = 0;
          table.columns.forEach(function(column) {
            if (yColKeys.includes(column[0])) {
              if (scope.seriesNames === undefined || scope.seriesNames[sc] === undefined) {
                // Use column header as series name (don't append index to first one)
                _chart.data.names[column[0]] = tc === 0 ? yColHeads[yci] : column[0];
              } else {
                // Use user-supplied series name
                _chart.data.names[column[0]] = scope.seriesNames[sc + _sc];
                _sc++;
              }
              yci++;
            }
          });
          sc += yColKeys.length;

          _chart.data.columns = _chart.data.columns.concat(table.columns);
        });

        // Identify X columns and Y columns
        if (_chart.data.xs) {
          xs = _.map(_chart.data.xs);
        } else {
          xs = [_chart.data.x];
        }
        xComps = _.filter(_chart.data.columns, function(o) {
          return xs.includes(o[0]);
        });
        xData = _.flatten(_.map(xComps, function(o) {
          return o.slice(1);
        }));
        yComps = _.reject(_chart.data.columns, function(o) {
          return xs.includes(o[0]);
        });
        ys = _.map(yComps, function(o) {return o[0];});
        yData = _.flatten(_.map(yComps, function(o) {
          return o.slice(1);
        }));

        // label/position axes
        _chart.axis.x.label.text = scope.xLabel ? scope.xLabel : xColHeads[0];
        if (scope.xLabelPos) {
          _chart.axis.x.label.position = scope.xLabelPos;
        }
        _chart.axis.y.label.text = scope.yLabel ? scope.yLabel : yColHeads[0];
        if (scope.yLabelPos) {
          _chart.axis.y.label.position = scope.yLabelPos;
        }

        // Graph types
        if (scope.type) {
          scope.type = processType(scope.type);
          _chart.data.type = scope.type;
        } else if (scope.types) {
          scope.types = scope.types.map(processType);
          _chart.data.types = scope.types;
        }

        // Graph appearance
        if (typeof scope.padding !== "undefined") {
          _chart.padding = scope.padding;
        }

        // Define units for tooltips
        unitX = getUnit(_chart.axis.x.label.text);
        unitY = getUnit(_chart.axis.y.label.text);
        _chart.tooltip.format.title = function(x) {
          return x + unitX;
        };
        _chart.tooltip.format.value = function(y, ratio, id, index) {
          return y + unitY;
        };

        // console.log(_chart);
        deferred.resolve(_chart);

        // Handle step-before or step-after types
        function processType(type) {
          if (type === 'step-before' || type === 'step-after') {
            _chart.line.step = {type: type};
            type = 'step';
          } else if (type === 'area-step-before' || type === 'area-step-after') {
            var arr = type.split('-');
            type = arr[0] + '-' + arr[1];
            _chart.line.step = {type: arr[1] + '-' + arr[2]};
          }
          return type;
        }
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

    function logScale(base) {
      var logFn, safeLogFn, powFn, baseNum;
      // @TODO: Fix decimal rounding
      function logCustom(base, val) {
        return Math.log(val) / Math.log(base);
      }

      // Choose log function
      // @TODO: Add log1p and log2 support
      if (typeof base === 'string' && base.toLowerCase() === 'e') {
        logFn = Math.log;
        powFn = Math.exp;
        baseNum = Math.E;
      } else if (typeof base === 'number') {
        baseNum = base;
        if (base === 10) {
          logFn = Math.log10;
        } else if (logBase === 2) {
          logFn = Math.log2;
        } else {
          logFn = logCustom.bind({}, baseNum);
        }
        powFn = Math.pow.bind({}, baseNum);
      } else {
        console.warn('Unknown log base: "' + base + '"');
      }

      safeLogFn = function (val) {
        val = (val < DEFAULT.LOGSCALE_MIN ? DEFAULT.LOGSCALE_MIN : val);
        return logFn(val);
      };

      return {
        log: safeLogFn,
        pow: powFn,
        base: baseNum
      };
    }

    // @TODO: Add support for Y log scale
    function makeLogScale(base, scope, element, _chart, axis) {
      console.log('Making ' + axis + ' log-base-' + base);
      var logFn, powFn, scale;
      var axisData, axisKeys;

      scale = logScale(base);
      logFn = scale.log;
      powFn = scale.pow;

      axisData = axis === 'x' ? xData : yData;
      axisKeys = axis === 'x' ? xs : ys;
      var min = _.min(axisData);
      var max = _.max(axisData);
      min = (min < DEFAULT.LOGSCALE_MIN ? DEFAULT.LOGSCALE_MIN : min);
      var logMin = logFn(min);
      var logMax = logFn(max);
      console.log("Min: " + logMin);
      console.log("Max: " + logMax);
      var logVal = Math.floor(logMin) - DEFAULT.GRAPH_MARGIN;
      _chart.axis[axis].tick.values = [];
      while (logVal <= Math.ceil(logMax) + DEFAULT.GRAPH_MARGIN) {
        _chart.axis[axis].tick.values.push(logVal++);
      }
      _chart.axis[axis].padding = {
        right: DEFAULT.GRAPH_MARGIN_CROP,
        left: DEFAULT.GRAPH_MARGIN_CROP
      };

      // Format tooltip
      // @TODO: Unit can also be derived from different X columns
      if (axis === 'x') {
        _chart.tooltip.format.title = function(x) {
          return (Math.round(powFn(x)*100)/100) + unitX;
        };
      } else if (axis === 'y') {
        _chart.tooltip.format.value = function(y, ratio, id, index) {
          return (Math.round(powFn(y)*100)/100) + unitY;
        };
      }
      // Format ticks and add grid lines
      var firstRender = true;
      var gridDrawFn = function() {
        if (firstRender) {
          firstRender = false;
          // Add grid lines
          scope.chart[axis+'grids'].add(logGrid(scope.chart, this[axis+'Axis'].tickValues(), 'log-grid'));
        }
      };
      var tickModded = false;
      var tickModFn = function() {
        if (!tickModded) {
          $(this.axes[axis][0]).find('.tick>text>tspan').html(function(i, power) {
            // @TODO: Refactor SVG exponent/superscript rendering
            return base + sup(power);
          });
          tickModded = true;
        }
      };
      _chart._onrendered.push(gridDrawFn);
      _chart._postrender.push(tickModFn);

      // Convert log axis values to log values
      _chart.data.columns.forEach(function(column) {
        var i;
        if (axisKeys.includes(column[0])) {
          for (i = 1; i < column.length; i++) {
            column[i] = logFn(column[i]);
          }
        }
      });

      function logGrid(chart, ticks, className) {
        var powLast, grids = [];
        // Passing undefined to logGridLine() will use the position value
        var gridLabel = (scope.logScaleLabel === false ? '' : undefined);

        // Generate grid lines
        if (ticks !== undefined) {
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
        } else {
          console.warn('No ticks found.');
        }

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
          // Both axes use same log base
          makeLogScale(scope.logScale, scope, element, _chart, 'x');
          makeLogScale(scope.logScale, scope, element, _chart, 'y');
        } else {
          // Single axes or both with distinct bases
          if (scope.logScaleX) {
            makeLogScale(scope.logScaleX, scope, element, _chart, 'x');
          }
          if (scope.logScaleY) {
            makeLogScale(scope.logScaleY, scope, element, _chart, 'y');
          }
        }
        // execute postrender callbacks (e.g. gridl lines and tick modifications)
        _chart.onrendered = function(){
          for (var i in _chart._onrendered) {
            _chart._onrendered[i].call(this);
          }
          for (i in _chart._postrender) {
            _chart._postrender[i].call(this);
          }
        };
        console.log(_chart);
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
        logScaleX: '=',
        logScaleY: '=',
        logScaleLabel: '=',
        tickFit: '@', // accepted values: '', 'xy', 'yx', 'x', 'y'
        grid: '=', // @todo {number|number[2]|undefined}
        tickPrecision: '@', // @todo
        legend: '=', // @todo {boolean}
        type: '@',
        types: '=',
        padding: '='
      },
      link: mmsGraphLink
    };
  }
})();
