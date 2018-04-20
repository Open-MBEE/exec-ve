'use strict';
 angular.module('mms.directives')
    .directive('mmsC3Plot', ['$q', 'ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsC3Plot]);
function mmsC3Plot($q, ElementService, UtilsService, TableService, $compile, growl, $window) {
      
  var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {

  
    var c3 = $window.c3;
    var d3 = $window.d3;  
    var svg = d3.select(element[0]).append('div');
   
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
    if ( scope.plot.config.length !== 0){
      scope.plot.config = JSON.parse(scope.plot.config.replace(/'/g, '"'));
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

    function vf_pplot(c3json, c3jfunc) { 

      if ( c3jfunc !== undefined) {
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
      
      console.log(JSON.stringify(c3json));
      var chart = c3.generate(c3json);
    }//end of vf_pplot()
  
    scope.render = function() {
      TableService.readvalues(scope.plot, projectId, refId, commitId)
       .then( function(value){
          scope.valuesO = value.tablebody.valuesO; //value objects used in watch
          var c3options;
          if (value.tablebody.c3_data.length === 0) { //no data
            return;
          }
          if ( scope.plot.config.options === undefined || scope.plot.config.options.length === 0 ){
            if (value.isHeader)
              c3options = {data: {x: "x", type: "line"}, axis : {x: {type:"category", tick:{centered:true}}}};
            else 
              c3options = {data: {}};
          }
          else
              c3options = scope.plot.config.options;
          if ( value.tablebody.c3_data.length === scope.plot.table.body.length && 
              c3options.data.xs === undefined && value.isHeader){
              value.tablebody.c3_data.unshift(['x'].concat(value.tableheader));
          }
          c3options.data.columns = value.tablebody.c3_data;

          var c3jfunc;
          if ( scope.plot.config.functions !== undefined && scope.plot.config.functions.length !== 0){
            c3jfunc = scope.plot.config.functions;//JSON.parse(scope.plot.config.functions.replace(/'/g, '"'));
          }
          svg.selectAll('*').remove();
          svg.append('div').attr("id", 'c3chart' + scope.$id);
          c3options.bindto = '#c3chart' + scope.$id;
        
        vf_pplot(c3options, c3jfunc); 
      });
    };//end of render

  
    scope.$watch('valuesO', function(newVals, oldVals) {
        return scope.render();
    }, true);
  }; //end of link

  return {
    restrict: 'EA',
    require: '?^mmsView',
     scope: {
      plot: '<'
    },
    link: mmsChartLink
  }; //return
}



