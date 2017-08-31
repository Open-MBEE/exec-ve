'use strict';
 angular.module('mms.directives')
    .directive('mmsC3Plot', ['$q', 'ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsC3Plot]);
function mmsC3Plot($q, ElementService, UtilsService, TableService, $compile, growl, $window) {
      
  var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {

    var c3 = $window.c3;
    scope.rowHeaders=[]; //not null when render is called 1st time.      
    var d3 = $window.d3;  
    var svg = d3.select(element[0]).append('div');
    
    var processed = false;
 
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
      if ( scope.plot.config.functions !== undefined && scope.plot.config.functions.length !== 0){
        var c3jfunc = scope.plot.config.functions;//JSON.parse(scope.plot.config.functions.replace(/'/g, '"'));
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
    
    //var json = JSON.stringify(c3json);
    //console.log(json);
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
    if ( scope.plot.config.options === undefined || scope.plot.config.options.length === 0 ){
      if (scope.tableColumnHeadersLabel && scope.tableColumnHeadersLabel.length !== 0)
        c3options = {data: {x: "x", type: "line"}, axis : {x: {type:"category", tick:{centered:true}}}};
      else 
        c3options = {data: {}};
    }
    else
        c3options = scope.plot.config.options;

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
        
        //not a number - it should be reference
        if (isNaN(scope.datavalues[i][j])){
          if ( scope.datavalues[i][j].type === "Class"){ //sourceProperty = "documentation"
          
            if ( scope.indexDocumentation.includes(i+","+j)){
              if ( !isNaN(scope.datavalues[i][j].documentation))
                c3_data_row[j] = Number(scope.datavalues[i][j].documentation);
            }
            else if (scope.indexName.includes(i+","+j)){
              if ( !isNaN(scope.datavalues[i][j].name))
                c3_data_row[j] = Number(scope.datavalues[i][j].name);
            }
          }
          else {
            if (scope.datavalues[i][j].type === "Property" || scope.datavalues[i][j].type === "Port")
              datavalue = scope.datavalues[i][j].defaultValue;
            else if (scope.datavalues[i][j].type === "Slot") //sourceProperty = "value"
              datavalue = scope.datavalues[i][j].value[0];
            
            if (datavalue && datavalue.type === "LiteralString")
              c3_data_row[j] = Number(datavalue.value);
            else if (datavalue && (datavalue.type === "LiteralReal" || datavalue.type === "LiteralInteger"))
              c3_data_row[j] = datavalue.value;
          }
        } //it is number
        else
          c3_data_row[j] = scope.datavalues[i][j];
      } //end of j
     	c3_data[1+start_index++] = [scope.tableRowHeaders[i].name].concat(c3_data_row);
    } //end of i
    //////////////////////////////////
    vf_pplot(c3_data, c3options, has_column_header); //c3_columns
   
  };//end of render

    scope.$watch('datavalues', function(newVals, oldVals) {
        return scope.render();
    }, true);

    console.log("C3==================");
            console.log("projectId: " + projectId);
            console.log("commitIt: " + commitId);
            console.log("refId: " + refId);
            
    console.log(scope);
    scope.plot = JSON.parse(scope.splot);
    var reqOb = {tableData: scope.plot.table, projectId: projectId, refId: refId, commitId: commitId};

    TableService.readTable (reqOb)
      .then(function(value) {
        scope.tableColumnHeadersLabel = value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
        scope.indexDocumentation = value.indexDocumentation;
        scope.indexName = value.indexName;
      });
    if ( scope.plot.config.length !== 0){
      scope.plot.config = JSON.parse(scope.plot.config.replace(/'/g, '"'));
    }
  }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        //plot: '<mmsPlot'
        splot: '@'
      },
      link: mmsChartLink
    }; //return
}



