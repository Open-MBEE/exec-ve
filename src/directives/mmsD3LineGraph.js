(function() {'use strict';
  angular.module('mms.directives')
    .directive('mmsLineGraph', ['TableService', '$window', mmsLineGraph]);
  function mmsLineGraph(TableService, $window) {

    function mmsGraphLink(scope, element, attrs, mmsViewCtrl) {
      console.log('mmsGraphLink()');
      var d3 = $window.d3;
      var c3 = $window.c3;

      var ws = scope.mmsWs;
      var version = scope.mmsVersion;

      TableService.readTables (scope.eid, ws, version)
      .then(function(value) {
        var data = {
            x: 'x',
            columns: [
              ['x'],
              ['label']
            ],
          };

        scope.table = {};
        scope.table.titles = value.tableTitles;
        scope.table.ids = value.tableIds;
        scope.table.columnHeaderLabels = value.tableColumnHeadersLabels;
        scope.table.rowHeaders = value.tableRowHeaders;
        scope.table.data = value.datavalues; //[][] - array
        scope.table.idFilters = value.dataIdFilters;
        //console.log(scope.table);
        scope.table.rowHeaders[0].forEach(function(val){
          data.columns[0].push(val.specialization.value[0].double);
        });
        scope.table.data[0].forEach(function(val){
          data.columns[1].push(val[0].specialization.value[0].double);
        });
        // console.log(chart);
        var chart = c3.generate({
          data: data
        });
        $(element).append(chart.element);
      });
    }

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        eid: '@'
      },
      link: mmsGraphLink
    };
  }
})();
