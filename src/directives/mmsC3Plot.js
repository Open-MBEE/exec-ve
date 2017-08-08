'use strict';
 angular.module('mms.directives')
    .directive('mmsC3Plot', ['$q', 'ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsC3Plot]);
function mmsC3Plot($q, ElementService, UtilsService, TableService, $compile, growl, $window) {
      
  var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {

    var c3 = $window.c3;
    scope.rowHeaders=[]; //not null when render is called 1st time.      
    var d3 = $window.d3;  
    var svg = d3.select(element[0])
      .append('div');
    
    var processed = false;
    var ws = scope.mmsWs;
    var version = scope.mmsVersion;
 
  var projectId;
  var refId;
  var commitId;
        
  if (mmsViewCtrl) {
      var viewVersion = mmsViewCtrl.getElementOrigin();
      if (!projectId)
          projectId = viewVersion.projectId;
      if (!refId)
          refId = viewVersion.refId;
      if (!commitId)
          commitId = viewVersion.commitId;
  }
   function convertToEvalString(values, allkeys){
      values = eval(values);
      var results = [];
      var counter = 0;
      for (var key in values){
        if ( values.hasOwnProperty(key)){
          var value = values[key];
          if ( typeof value === "object"){
            var resultValue = convertToEvalString(value, allkeys + "." + key);
            results[counter] = resultValue;
          }
          else {
            return "[" + allkeys + "." + key + "= (" + value + ")]"; 
            //[c3json.axis.y.tick.format= (function(y){return y + "!";})]
          }
          counter++;
        }
      }
      if ( results.length == 1)
        return results[0];
      else
        return results;
    }  
    /*
    Convert a json definining functions in an array of keys (axis, x, tick, format, function(...))
    The last entry is a function value.
    */  
    function simplifyFunctions(values, allkeys){
      values = eval(values);
      var results = [];
      
      var keys = Object.keys(values);
      var tallkeys = [];
      for ( var ii = 0; ii < keys.length; ii++){
        if ( values.hasOwnProperty(keys[ii])){
          var value = values[keys[ii]];
          if ( typeof value === "object"){
            tallkeys[ii] = [].concat(allkeys);
            tallkeys[ii].push(keys[ii]);
            var resultValue = simplifyFunctions(value, tallkeys[ii]);
            if ( resultValue.length == 1)
              results[ii] = resultValue[0];
            else
              results[ii] = resultValue;
          }
          else {
            allkeys.push(keys[ii]);
            allkeys.push(value);
            return allkeys;
          }
        }
      }
      if ( results.length == 1)
        return results[0];
      else
        return results;
    }
    function vf_pplot(_columns, c3json, _has_column_header) {

      svg.append('div').attr("id", 'c3chart' + scope.$id);
      c3json.bindto = '#c3chart' + scope.$id;
      

      c3json.data.columns = _columns;
      if ( scope.plot.functions !== undefined && scope.plot.functions.length !== 0){
        var c3jfunc = JSON.parse(scope.plot.functions.replace(/'/g, '"'));
        //finiding functions in .format (ie., axis.x.tick = function(...) in an array)
        var all = [];
        all = simplifyFunctions(c3jfunc, all);
        var keysInArray = []; //default
        //when only one function is defined, it is not in an array so put in an array.
        if (all.length > 0  && (typeof all[0] === "string"))
          keysInArray.push(all);
        else
          keysInArray = all;
        var keysInDot = ""; //i.e., axis.x.tick
        var parent;
        for ( var iii = 0; iii < keysInArray.length; iii++){
          keysInDot = "";
          parent = c3json;
          for ( var jj = 0; jj < keysInArray[iii].length-1; jj++){
            keysInDot += keysInArray[iii][jj];
            //create a variable recursively
            if (parent[keysInArray[iii][jj]] === undefined){
              var evs_iijj = ['c3json.'+ keysInDot, '=', '{}'].join(' ');
              eval(evs_iijj); 
            }
            parent = parent[keysInArray[iii][jj]];
            keysInDot += ".";
          }
          keysInDot = keysInDot.substring(0, keysInDot.length -1); //remove last "."
          var lastIndex_iijj = keysInArray[iii].length - 1 ;
          //create a function
          var evs2_iijj = "[c3json." + keysInDot + "= (" + keysInArray[iii][lastIndex_iijj] + ")]"; 
          eval(evs2_iijj);
        }
    }
    
    var json = JSON.stringify(c3json);
    var chart = c3.generate(c3json);

	}//end of vf_pplot()
  scope.render = function() {

    if (scope.plot.table === undefined || scope.datavalues === undefined) { //data is not from table
      return;
    }
    svg.selectAll('*').remove();
	
  	var has_column_header;
    var start_index; //0 if column header is included as data, -1 if column header is not included as data
    var c3_data=[];

      var c3options;    
      if ( scope.plot.options === undefined || scope.plot.options.length === 0 ){
        if (scope.tableColumnHeadersLabel && scope.tableColumnHeadersLabel.length !== 0){
          c3options = JSON.parse('{"data": {"x": "x", "type": "line"},"axis" : {"x": {"type":"category", "tick":{"centered":true}}}}');
        }
        else
          c3options = JSON.parse('{"data": {}}');  
      }
      else {
        c3options = JSON.parse(scope.plot.options.replace(/'/g, '"'));
      }
 
      if ( c3options.data.xs === undefined && scope.tableColumnHeadersLabel.length !== 0){
          c3_data[0] = ['x'].concat(scope.tableColumnHeadersLabel);
          start_index = 0;
          has_column_header = true;
      }
      else { //xs defined, then column headers are ignored even they exist.
        has_column_header = false;
        start_index = -1;
      }

    for ( var i = 0; i < scope.datavalues.length; i++){
	     var c3_data_row=[];
       
      for ( var j = 0; j < scope.datavalues[i].length; j++){
        var datavalue = null;

        if (scope.datavalues[i][j].vatype === "Property" || scope.datavalues[i][j].type === "Port")
          datavalue = scope.datavalues[i][j].defaultValue;
        else if (scope.datavalues[i][j].type === "Slot")
          datavalue = scope.datavalues[i][j].value[0];
        if (datavalue && datavalue.type === "LiteralString")
          c3_data_row[j] = Number(datavalue.value);
        else if (datavalue && (datavalue.type === "LiteralReal" || datavalue.type === "LiteralInteger"))
          c3_data_row[j] = datavalue.value;
      } //end of j
     	c3_data[1+start_index++] = [scope.tableRowHeaders[i].name].concat(c3_data_row);
    } //end of i
    //////////////////////////////////
    vf_pplot(c3_data, c3options, has_column_header); //c3_columns
   
  };//end of render

    scope.$watch('datavalues', function(newVals, oldVals) {
        return scope.render();
    }, true);

   
    var reqOb = {tableData: scope.plot.table, projectId: projectId, refId: refId, commitId: commitId};

    TableService.readTable (reqOb, ws, version)
      .then(function(value) {
        scope.tableColumnHeadersLabel = value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
      });
  }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        plot: '<mmsPlot'
      },
      link: mmsChartLink
    }; //return
}



