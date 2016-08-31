'use strict';
 angular.module('mms.directives')
    .directive('mmsC3', ['ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsC3]);
function mmsC3(ElementService, UtilsService, TableService, $compile, growl, $window) {
      
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
    function vf_pplot(_columns, _index, _is_x_value_number) {

      //console.log("vfxxxxx: " + scope.c3datatype);
      svg.append('div').attr("id", 'c3chart' + _index);
      var c3json = {
         bindto: '#c3chart' + _index,
         data: {
          x: 'x',
          columns:  _columns, //including column heading
          type: scope.c3datatype
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
     
      if (scope.c3datatype === 'line'){
        console.log("_is_x_value_number: " + _is_x_value_number);
        if (_is_x_value_number === false){
          setAxisAsCategory(c3json);
        }
      }
     if ( scope.c3datatype === 'bar'){
      //optional: c3barwidthratio, c3barwidth
     
        c3json = setAxisAsCategory(c3json);
      c3json.bar ={};
      c3json.bar.width = {};
      if ( scope.c3barwidth !== undefined)
        c3json.bar.width = scope.c3barwidth;
      if (scope.c3barwidthratio !== undefined)
        c3json.bar.width.ratio = scope.c3barwidthratio;
        
     }//end of bar 
    
    var json = JSON.stringify(c3json);
    console.log(json);
    var chart = c3.generate(c3json);
      

		var zz = {
      bindto: '#c3chart',

      data: {
        x: 'x',
        columns: [
            ['x', 1, 10, 50, 200],
          ['**target', 25, 25, 25, 45],
          ['**threshold', 5, 10, 10, 5],
          ['InstanceD1', 10,20,30,40]
        ],
        type: 'line'
      }/*,
      axis: {
        x: {
          type: 'category' // this needed to load string x value
        }
      },
      bar: {
          width: {
            ratio: 0.5 // this makes bar width 50% of length between ticks
          }
        // or
        //width: 100 // this makes bar width 100px
        }
        */ 
    };
    /*var json2 = JSON.stringify(zz);
    console.log(json2);
    c3.generate(zz);
    *///var chart = c3.generate(zz);

	}//end of vf_pplot()
  function setAxisAsCategory(_c3json){
      _c3json.axis = {};
      _c3json.axis.x = {};
      _c3json.axis.x.type = 'category';
      return _c3json;
  }
    scope.render = function() {

      console.log("333333333333333");
      console.log(scope.datavalues);
      console.log("44444444444444444");
    console.log('scopetableColumnHeadersLabel');
    console.log(scopetableColumnHeadersLabel);


      if (scopetableColumnHeadersLabel.length === 0) return;
      svg.selectAll('*').remove();
      
	/*console.log("columnHeader");  
	console.log(scopetableColumnHeadersLabel);
	console.log("rowHeader");
	console.log(scope.tableRowHeaders);
	console.log("datavalues");
	console.log(scope.datavalues);
	*/  
	var is_x_value_number = true; 
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

   vf_pplot(c3_data, k, is_x_value_number); //c3_columns
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
        scopetableColumnHeadersLabel= value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
        dataIdFilters = value.dataIdFilters;

        console.log("11111111111111111111111111111111");
        console.log(scopetableColumnHeadersLabel);
        console.log(scope.datavalues);
        console.log("22222222222222222222222222222222");
		
      });
    }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        mmsEid: '@',
        c3datatype: '@',
        c3barwidth: '@',
        c3barwidthratio: '@',
        tick2: '@',
        tick2color: '@',
        tick3: '@',
        tick3Color: '@'
      },
      link: mmsChartLink
    }; //return
}



