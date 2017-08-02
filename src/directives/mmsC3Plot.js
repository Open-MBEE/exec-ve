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
  function xx(values){
    
    console.log(values);
    
    var result = [];
    for (var key in values){
        var value = values[key];
        if ( value.hasOwnProperty(key) && value.constructor === Array) {
            for ( var cao = 0; cao < value.length; cao++){
              result[cao + '[' + cao + ']'] = xx(value[cao]);
            }
        }
      
        else if ( typeof value === "object"){
          for (var co in value){
            result[key + "." + co ] = xx(value[co]);
          }
        }
        else {
          console.log("value===============");
          console.log(value);
          result[key] = value;
        }
    }
    return result;
  }
  /*
  function xx2(fs, allkeys){
      console.log("========s======fs");
      fs = eval(fs);
      console.log(fs);
      for (var key in fs){
          console.log( "key = " + key);
        if ( fs.hasOwnProperty(key)){
          //console.log( fs[key]);
          //for (var key1 in fs[key]){
            //console.log("key1 = " + key1);
          //}s 
          
          console.log(typeof fs[key]);
          if ( typeof fs[key] === "object"){
            allkeys = allkeys + "." + key;
            return xx(fs[key], allkeys);
          }
          else
            return allkeys + "." + key + "======" + fs[key];
        }
      }
    }
    */
    function convertToEvalString(values, allkeys){
      values = eval(values);
      var results = [];
      var counter = 0;
      for (var key in values){
        if ( values.hasOwnProperty(key)){
          var value = values[key];
          //console.log(typeof value);
          if ( typeof value === "object"){
            //console.log("!!!!!!!!!!!!!!!!111");
            //console.log(allkeys + "." + key);
            /*var aa = allkeys + "." + key;
            var zz = aa.indexOf('.') +1;
            var all = aa.substr(zz);
            //console.log("all = " + all);
            //console.log(c3json[all]);  
                      
            if (c3json[all] === undefined){
                console.log("!!!!!!!!!!undefine!!!");
                var evalString0 = ['c3json.'+ all, '=', '{}'].join(' ');
                console.log(evalString0); 
                //eval(evalString0);
                console.log(c3json[all]);
              }
            */
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
              console.log("!creating a variable: " + evs_iijj);
              eval(evs_iijj); 
            }
            else
              console.log(keysInDot + " is already defined.");
            parent = parent[keysInArray[iii][jj]];
            keysInDot += ".";
          }
          keysInDot = keysInDot.substring(0, keysInDot.length -1); //remove last "."
          var lastIndex_iijj = keysInArray[iii].length - 1 ;
          //create a function
          var evs2_iijj = "[c3json." + keysInDot + "= (" + keysInArray[iii][lastIndex_iijj] + ")]"; 
          console.log("!executing a function: "+ evs2_iijj);
          eval(evs2_iijj);
        }
    }
    
    var json = JSON.stringify(c3json);
    console.log(json);
    var chart = c3.generate(c3json);
    
    /*var zz2 = {bindto:'#c3chart' + scope.$id + _index,
    data: {
        type: 'line',
        types: {
            data3: 'bar',
            data4: 'bar',
            data6: 'area',
        },
        groups: [
            ['data3','data4']
        ],
        columns: [
            ['data1', 30, 20, 50, 40, 60, 50],
            ['data2', 200, 130, 90, 240, 130, 220],
            ['data3', 300, 200, 160, 400, 250, 250],
            ['data4', 200, 130, 90, 240, 130, 220],
            ['data5', 130, 120, 150, 140, 160, 150],
            ['data6', 90, 70, 20, 50, 60, 120],
        ]
        
    }
  };
    var json2 = JSON.stringify(zz2);
    console.log(json2);
    var chart = c3.generate(zz2);
    */

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
          //c3options = JSON.parse('{"data": {"x": "x"}}'); //nothing displayed
          //c3options = JSON.parse('{"data": {"x": "x"}, "axis" : {"x": {}}}'); //nothing displayed  
          //c3options = JSON.parse('{"data": {"x": "x"}, "axis" : {"x": {"type" : "category"}}}');
        }
        else
          c3options = JSON.parse('{"data": {}}');  
      }
      else 
        c3options = JSON.parse(scope.plot.options.replace(/'/g, '"'));
 
      if ( c3options.data.xs === undefined && scope.tableColumnHeadersLabel.length !== 0){
          c3_data[0] = ['x'].concat(scope.tableColumnHeadersLabel);
          start_index = 0;
          has_column_header = true;
          //if (isNaN(scope.tableColumnHeadersLabel[0]))        
            //is_x_value_number = false;
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



