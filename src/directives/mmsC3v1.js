'use strict';
 angular.module('mms.directives')
    .directive('mmsC3v1', ['ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsC3v1]);
function mmsC3v1(ElementService, UtilsService, TableService, $compile, growl, $window) {
      
  var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {
   
    var c3 = $window.c3;
    scope.rowHeaders=[]; //not null when render is called 1st time.      
    var d3 = $window.d3;  
    var svg = d3.select(element[0])
      .append('div');
      //.attr("id", "c3chart");
    
    var processed = false;
    var ws = scope.mmsWs;
    var version = scope.mmsVersion;
    if (mmsViewCtrl) {
        var viewVersion = mmsViewCtrl.getWsAndVersion();
        if (!ws)
            ws = viewVersion.workspace;
        if (!version)
            version = viewVersion.version;
    }
    function vf_pplot(_columns, _index, _is_x_value_number, _has_column_header) {

      console.log('c3datatypes: ' + scope.c3datatypes);
      //console.log("vfxxxxx: " + scope.c3datatype);
      svg.append('div').attr("id", 'c3chart' + _index);
      var c3json = {
         bindto: '#c3chart' + _index,
         data: {
          //x: 'x',
          columns:  _columns, //including column heading
          //type: scope.c3datatype
        }
        /*,
        axis: {
          x: {
            type: 'category' // this needed to load string x value
          }
        }*//*,
        bar: {
          width: {
            ratio: 0.5 // this makes bar width 50% of length between ticks
          }
        // or
        //width: 100 // this makes bar width 100px
        } */
      };
      if ( _has_column_header){
        c3json.data.x = 'x';  
      }
      if (_is_x_value_number === false){ //row 1 is heading but not numbers (column0 is ignored)
          setAxisAsCategory(c3json);
      }
      if (scope.c3datatypes === undefined){
        c3json.data.type = scope.c3datatype;
        if (scope.c3datatype === 'line'){
          //if (_is_x_value_number === false){ //row 1 is heading but not numbers (column0 is ignored)
            //setAxisAsCategory(c3json);
          //}
        }
         //optional: c3barwidthratio, c3barwidth
        else if ( scope.c3datatype === 'bar'){
          //setAxisAsCategory(c3json);
          c3json.bar ={};
          c3json.bar.width = {};
          if ( scope.c3barwidth !== undefined)
            c3json.bar.width = scope.c3barwidth;
          if (scope.c3barwidthratio !== undefined)
            c3json.bar.width.ratio = scope.c3barwidthratio;
        }//end of bar 
       } else { //mix
        var _c3datatypes = scope.c3datatypes.split(',');
        if (_c3datatypes.length === scope.tableRowHeaders[_index].length){
          var _c3datatype_i_name;
          c3json.data.types = {};
          for ( var ii = 0; ii < _c3datatypes.length; ii++) {    
            _c3datatype_i_name = scope.tableRowHeaders[_index][ii].name;
            c3json.data.types[_c3datatype_i_name] = _c3datatypes[ii];
          }
        } 
      }
      if (scope.c3datagroups !== undefined){
        console.log("scope.c3datagroups");
        c3json.data.groups = [];

        var temp;
        var _c3datagroups = scope.c3datagroups.split(':');
        _c3datagroups.forEach( function(_c3datagroup){
          temp = [];
          var _c3datagroup_i = _c3datagroup.split(',');
          _c3datagroup_i.forEach(function(value){
            temp.push(value);
            console.log(value);
            console.log(temp);
          } );
          c3json.data.groups.push(temp);
        });
      }
    
    var json = JSON.stringify(c3json);
    console.log(json);
    var chart = c3.generate(c3json);
    

    var zz2 = {bindto:'#c3chart' + _index ,
    data: {
        columns: [
            ['data1', 30, 20, 50, 40, 60, 50],
            ['data2', 200, 130, 90, 240, 130, 220],
            ['data3', 300, 200, 160, 400, 250, 250],
            ['data4', 200, 130, 90, 240, 130, 220],
            ['data5', 130, 120, 150, 140, 160, 150],
            ['data6', 90, 70, 20, 50, 60, 120],
        ],
        type: 'line',
        types: {
            data3: 'bar',
            data4: 'bar',
            data6: 'area',
        },
        groups: [
            ['data3','data4']
        ]
    }
  };

    //var json2 = JSON.stringify(zz);
    //console.log(json2);
    //c3.generate(zz);

	}//end of vf_pplot()

  /*      axis: {
          x: {
            type: 'category' // this needed to load string x value
          } */
  function setAxisAsCategory(_c3json){
      _c3json.axis = {};
      _c3json.axis.x = {};
      _c3json.axis.x.type = 'category';
      return _c3json;
  }
  
  scope.render = function() {

    if (scopetableColumnHeadersLabel.length === 0) return;
      svg.selectAll('*').remove();
      
	/*console.log("columnHeader");  
	console.log(scopetableColumnHeadersLabel);
	console.log("rowHeader");
	console.log(scope.tableRowHeaders);
	console.log("datavalues");
	console.log(scope.datavalues);
	*/  
	var is_x_value_number = true;  //column headings are number (not check 1st column)
  var has_column_header = true;
  for ( var k = 0; k < scopeTableIds.length; k++){
		var c3_data=[];


    c3_data[0] = ['x'].concat(scopetableColumnHeadersLabel[k]);
    //console.log("not a number?: ");
    //console.log(isNaN(scopetableColumnHeadersLabel[k][0]));
    if (isNaN(scopetableColumnHeadersLabel[k][0]))
      is_x_value_number = false;

    for ( var i = 0; i < scope.datavalues[k].length; i++){
	     var c3_data_row=[];
       
      for ( var j = 0; j < scope.datavalues[k][i].length; j++){
			  if (scope.datavalues[k][i][j].specialization.value[0].type === "LiteralString"){
          c3_data_row[j] = Number(scope.datavalues[k][i][j].specialization.value[0].string);
        }
        else if (scope.datavalues[k][i][j].specialization.value[0].type === "LiteralReal"){
          c3_data_row[j] = scope.datavalues[k][i][j].specialization.value[0].double;
        }
        else if (scope.datavalues[k][i][j].specialization.value[0].type === "LiteralInteger"){
           c3_data_row[j] = scope.datavalues[k][i][j].specialization.value[0].integer;
        }
      } //end of j
     	c3_data[i+1] = [scope.tableRowHeaders[k][i].name].concat(c3_data_row);
    } //end of i

    console.log("&&&&&&&&&:     " + k);
    console.log(c3_data);

   vf_pplot(c3_data, k, is_x_value_number, has_column_header); //c3_columns
   }//end of k (each table)
  };//end of render

    scope.$watch('datavalues', function(newVals, oldVals) {
        return scope.render();
    }, true);
      
    var scopeTableTitles=[];
    var scopeTableIds = [];
    var scopetableColumnHeadersLabel= [];
    var dataIdFilters = [];

    TableService.readTables (scope.mmsEid,ws, version)
      .then(function(value) {
        scopeTableTitles = value.tableTitles;
        scopeTableIds = value.tableIds;
        scopetableColumnHeadersLabel = value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
        dataIdFilters = value.dataIdFilters;
      });
    }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        mmsEid: '@',
        c3datatype: '@',
        c3datatypes: '@',
        c3datagroups:  '@',
        c3barwidth: '@',
        c3barwidthratio: '@',
        tick2color: '@',
        tick3: '@',
        tick3Color: '@'
      },
      link: mmsChartLink
    }; //return
}



