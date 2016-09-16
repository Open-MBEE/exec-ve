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

      svg.append('div').attr("id", 'c3chart' + scope.$id + _index);
      var c3json = {
         bindto: '#c3chart' + scope.$id + _index,
         data: {
          columns:  _columns, //including column heading
        }
      };
      //Data
      if (scope.c3dataxs)
        c3json.data.xs = JSON.parse( scope.c3dataxs.replace(/'/g, '"'));
      if ( _has_column_header && scope.c3dataxs === undefined)
        c3json.data.x = 'x';  
       //x or xs
      if (_is_x_value_number === false && scope.c3dataxs === undefined){ //row 1 is heading but not numbers (column0 is ignored)
           if (c3json.axis === undefined)  c3json.axis = {};
           if (c3json.axis.x === undefined) c3json.axis.x = {};
           c3json.axis.x.type = 'category';
      }
      if (scope.c3dataaxes)
        c3json.data.axes = JSON.parse( scope.c3dataaxes.replace(/'/g, '"')); 
      if (scope.c3datanames){
        c3json.data.names = JSON.parse( scope.c3datanames.replace(/'/g, '"')); 
      }
      if (scope.c3dataclasses)
        c3json.data.classes = JSON.parse( scope.c3dataclasses.replace(/'/g, '"')); 
      
      if (scope.c3datalabelsformat){
        if (c3json.data.labels === undefined) c3json.data.labels = {};
        c3json.data.labels.format = eval("(" + scope.c3datalabelsformat + ")");
      }
      else if (scope.c3datalabels)
        c3json.data.labels = eval("(" + scope.c3datalabels + ")");
      if ( scope.c3dataorder){ //pie and docut -asc not working
        if ( scope.c3dataorder === "null")
          c3json.data.order = null;
        else 
          c3json.data.order = scope.c3dataorder;
      }
      if (scope.c3datacolors){ //{data1: '#ff0000', data2: '#ff0000'}
        c3json.data.colors = JSON.parse( scope.c3datacolors.replace(/'/g, '"')); 
      }   
      if (scope.c3datacolor){ // function (color, d){...}
        c3json.data.color = eval("(" + scope.c3datacolor + ")");
      }   
      if (scope.c3datahide){ //boolean or ['data1', 'data2']
          c3json.data.hide = eval("(" + scope.c3datahide + ")");
      }
      if (scope.c3dataemptylabeltext){
        if(c3json.data.empty === undefined) c3json.data.empty = {};
        if(c3json.data.empty.label === undefined) c3json.data.empty.label = {};
        c3json.data.empty.label.text = scope.c3dataemptylabeltext;
      }
      if (scope.c3dataselectionenabled){
        if ( c3json.data.selection === undefined) c3json.data.selection = {};
        c3json.data.selection.enabled = eval("(" + scope.c3dataselectionenabled + ")");
      }
      if (scope.c3dataselectiongrouped){
        if ( c3json.data.selection === undefined) c3json.data.selection = {};
        c3json.data.selection.grouped = eval("(" + scope.c3dataselectiongrouped + ")");
      }
      if (scope.c3dataselectionmultiple){
        if ( c3json.data.selection === undefined) c3json.data.selection = {};
        c3json.data.selection.multiple = eval("(" + scope.c3dataselectionmultiple + ")");
      }
      if (scope.c3dataselectiondraggable){
        if ( c3json.data.selection === undefined) c3json.data.selection = {};
        c3json.data.selection.draggable = eval("(" + scope.c3dataselectiondraggable + ")"); 
      }
      if (scope.c3dataselectionisselectable){
        if ( c3json.data.selection === undefined) c3json.data.selection = {};
        c3json.data.selection.isselectable = eval("(" + scope.c3dataselectionisselectable + ")");
      }
      if (scope.c3dataonclick)
          c3json.data.onclick = eval("(" + scope.c3dataonclick + ")");
      if (scope.c3dataonmouseover)
         c3json.data.onmouseover = eval("(" + scope.c3dataonmouseover + ")");
      if (scope.c3dataonmouseout)
         c3json.data.onmouseout = eval("(" + scope.c3dataonmouseout + ")");
      //Axis
      if (scope.c3axisrotated){
        if (c3json.axis === undefined) c3json.axis = {};
        c3json.axis.rotated = eval("(" + scope.c3axisrotated + ")");
      }
      if (scope.c3axisxshow){
        if (c3json.axis === undefined) c3json.axis = {};
        c3json.axis.x.show = eval("(" + scope.c3axisxshow  + ")");
      }
      if (scope.c3axisxtype){ //timeseries, category, or indexed
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.type = scope.c3axisxtype; 
      }
      if (scope.c3axisxlocaltime){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.localtime = eval("(" + scope.c3axisxlocaltime + ")");
      }
      //TODO: data.x vs. axis.x.categories - how to handle with column heading data
      /*if (scope.c3axisxcategories){ //['a1', 'b1']
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.categories = eval("(" + scope.c3axisxcategories + ")");
      }*/
      if (scope.c3axisxtickcentered){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
         c3json.axis.x.tick.centered = eval("(" + scope.c3axisxtickcentered + ")");
      }
      if (scope.c3axisxtickformat){//function(d){}
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
        if (scope.c3axisxtickformat.trim().startsWith("function"))
          c3json.axis.x.tick.format = eval("(" + scope.c3axisxtickformat + ")");
        else if (scope.c3axisxtickformat.indexOf('%') !== -1)
          c3json.axis.x.tick.format = scope.c3axisxtickformat;
      }
      //TODO: test with no column headers
      if (scope.c3axisxtickculling){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
         c3json.axis.x.tick.culling = eval("(" + scope.c3axisxtickculling  + ")");
      }
      //TODO: test with no column headers
      if (scope.c3axisxtickcullingmax){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
        if (c3json.axis.x.tick.culling === undefined) c3json.axis.x.tick.culling = {};
        c3json.axis.x.tick.culling.max = eval("(" +scope.c3axisxtickcullingmax + ")");
      }
      if (scope.c3axisxtickcount){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
        c3json.axis.x.tick.count = scope.c3axisxtickcount;
      }
      if (scope.c3axisxtickfit){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
         c3json.axis.x.tick.fit = eval("(" + scope.c3axisxtickfit + ")");
      }
      if (scope.c3axisxtickvalues){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
        c3json.axis.x.tick.values = eval("(" + scope.c3axisxtickvalues + ")");
      }
      if (scope.c3axisxtickrotate){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
        c3json.axis.x.tick.rotate = scope.c3axisxtickrotate;
      }
      if (scope.c3axisxtickouter){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
        c3json.axis.x.tick.outer = eval("(" + scope.c3axisxtickouter + ")");
      }
      if (scope.c3axisxmax){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.max = scope.c3axisxmax;
      }
      if (scope.c3axisxmin){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.min = scope.c3axisxmin;
      }
      if (scope.c3axisxpadding){ //{'left': '0', 'right': '0'}
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.padding = JSON.parse( scope.c3axisxpadding.replace(/'/g, '"')); 
      }   
      if (scope.c3axisxheight){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.height = scope.c3axisxheight;
      }
      if (scope.c3axisxextent){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.extent = eval("(" + scope.c3axisxextent + ")");
      }
      if (scope.c3axisxlabel !== undefined){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (scope.c3axisxlabel.startsWith("{"))
          c3json.axis.x.label = JSON.parse(scope.c3axisxlabel.replace(/'/g, '"')); 
        else
          c3json.axis.x.label = scope.c3axisxlabel;
      }
      //// axis.y
      if ( scope.c3axisyshow){ //boolean
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        c3json.axis.y.show = eval("(" + scope.c3axisyshow  + ")");
      }
      //c3axisytype: '@', 
      if ( scope.c3axisyinner){ //boolen
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        c3json.axis.y.inner = eval("(" + scope.c3axisyinner  + ")");
      }  
      if (scope.c3axisymax){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        c3json.axis.y.max = scope.c3axisymax;
      }
      if (scope.c3axisymin){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        c3json.axis.y.min = scope.c3axisymin;
      }  
      if (scope.c3axisyinverted){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        c3json.axis.y.inverted = scope.c3axisyinverted;
      }  
      if (scope.c3axisycenter){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        c3json.axis.y.center = scope.c3axisycenter;
      }
      if ( scope.c3axisylabel !== undefined){
          if (c3json.axis === undefined) c3json.axis = {};
          if (c3json.axis.y === undefined) c3json.axis.y = {};
          if (scope.c3axisylabel.startsWith("{"))
            c3json.axis.y.label = JSON.parse(scope.c3axisylabel.replace(/'/g, '"')); 
          else
            c3json.axis.y.label = scope.c3axisylabel;
      } 
      if (scope.c3axisytickformat){//function(d){}
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        if (c3json.axis.y.tick === undefined) c3json.axis.y.tick = {};
        if (scope.c3axisytickformat.trim().startsWith("function"))
          c3json.axis.y.tick.format = eval("(" + scope.c3axisytickformat + ")");
        else if (scope.c3axisytickformat.indexOf('%') !== -1)
          c3json.axis.y.tick.format = scope.c3axisytickformat;
      }
      if (scope.c3axisytickouter){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        if (c3json.axis.y.tick === undefined) c3json.axis.y.tick = {};
        c3json.axis.y.tick.outer = eval("(" + scope.c3axisytickouter + ")");
      }
      if (scope.c3axisytickvalues){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        if (c3json.axis.y.tick === undefined) c3json.axis.y.tick = {};
        c3json.axis.y.tick.values = eval("(" + scope.c3axisytickvalues + ")");
      }  
      if (scope.c3axisytickcount){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        if (c3json.axis.y.tick === undefined) c3json.axis.y.tick = {};
        c3json.axis.y.tick.count = scope.c3axisytickcount;
      }  
        //c3axisyticktimevalue: '@',
        //c3axisyticktimeinterval: '@',
      if (scope.c3axisypadding){ //{'top': '0', 'bottom': '0'}
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        c3json.axis.y.padding = JSON.parse( scope.c3axisypadding.replace(/'/g, '"')); 
      }  
      if (scope.c3axisydefault){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y === undefined) c3json.axis.y = {};
        if (c3json.axis.y.tick === undefined) c3json.axis.y.tick = {};
        c3json.axis.y.default = eval("(" + scope.c3axisydefault + ")");
      }   
      if ( scope.c3axisy2show !== undefined){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        c3json.axis.y2.show = eval("(" + scope.c3axisy2show + ")");
      }
      if ( scope.c3axisy2inner){ //boolen
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        c3json.axis.y2.inner = eval("(" + scope.c3axisy2inner  + ")");
      }    
        c3axisy2max: '@',
        c3axisy2min: '@',
        c3axisy2inverted: '@',
        c3axisy2center: '@',
        c3axisy2label: '@',
        c3axisy2tickformat: '@',
        c3axisy2tickouter: '@',
        c3axisy2tickvalues: '@',
        c3axisy2tickcount: '@',
        c3axisy2padding: '@',
        c3axisy2default: '@',


      if ( scope.c3gridylines !== undefined){
        if (c3json.grid === undefined) c3json.grid = {};
        if (c3json.grid.y === undefined) c3json.grid.y = {};
        c3json.grid.y.lines = JSON.parse( scope.c3gridylines.replace(/'/g, '"'));
      }
      
      
      
      if ( scope.c3datatype !== undefined) 
        c3json.data.type = scope.c3datatype;
      if ( scope.c3datatypes !== undefined ) {//mix, scope.c3datatypes defined
        //{'a1':'step', 'a2':'area-step'}
        //to
        //{"a1":"step", "a2":"area-step"}
        c3json.data.types = JSON.parse( scope.c3datatypes.replace(/'/g, '"'));
      }
      if (scope.c3datagroups !== undefined){
        console.log("scope.c3datagroups");
        c3json.data.groups = JSON.parse( scope.c3datagroups.replace(/'/g, '"'));
      }
      if ( scope.c3dataregions !== undefined){
        //modify
        // {'a1':[{'start':1, 'end':2, 'style':'dashed'},{'start':3}],'a2':[{'end':3}]}
        //to 
        //{"a1":[{"start":1, "end":2, "style":"dashed"},{"start":3}],"a2":[{"end":3}]}
        c3json.data.regions = JSON.parse(scope.c3dataregions.replace(/'/g, '"'));
      }
      //bar - width or ratio
      if ( scope.c3barwidth !== undefined){
        c3json.bar = {};
        c3json.bar.width = {};
        c3json.bar.width = scope.c3barwidth;
      } else if ( scope.c3barwidthratio !== undefined){
        c3json.bar = {};
        c3json.bar.width = {};
        c3json.bar.width.ratio = scope.c3barwidthratio;
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
  var start_index; //0 if column header is included as data, -1 if column header is not included as data
  for ( var k = 0; k < scopeTableIds.length; k++){
		var c3_data=[];

    console.log("scope.c3dataxs" + scope.c3dataxs);
    if ( scope.c3dataxs === undefined) {
      c3_data[0] = ['x'].concat(scopetableColumnHeadersLabel[k]);
      start_index = 0;
    }
    else {//Assume if xs is defined, no column header
      has_column_header = false;
      start_index = -1;
    }
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
     	c3_data[1+start_index++] = [scope.tableRowHeaders[k][i].name].concat(c3_data_row);
    } //end of i
    ////////////////////temporary remove column header///////////////
    /*var temp = [];
    for (var jj = 1; jj < c3_data.length; jj++){
      temp[jj-1] = c3_data[jj];
    }
    c3_data = temp;
    if ( c3_data.length === 5)
    */
    console.log("c3_data");
    console.log(c3_data);
    //////////////////////////////////
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

    TableService.readTables (scope.mmsEid, ws, version)
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
        c3dataxs: '@',
        c3datanames: '@',
        c3dataclasses: '@',
        c3datagroups:  '@',
        c3dataaxes: '@',
        c3datatype: '@',
        c3datatypes: '@',
        c3datalabels: '@',
        c3datalabelsformat: '@',
        c3dataorder: '@',
        c3dataregions: '@',
        c3datacolors: '@',
        c3datacolor: '@',
        c3datahide: '@',
        c3dataemptylabeltext: '@',
        c3dataselectionenabled: '@',
        c3dataselectiongrouped: '@',
        c3dataselectionmultiple: '@',
        c3dataselectiondraggable: '@',
        c3dataselectionisselectable: '@',
        c3dataonclick: '@',
        c3dataonmouseover: '@',
        c3dataonmouseout: '@',
        c3axisrotated: '@',
        //axis.x
        c3axisxshow: '@',
        c3axisxtype: '@',
        c3axisxlocaltime: '@',
        c3axisxcategories: '@',
        c3axisxtickcentered: '@',
        c3axisxtickformat: '@',
        c3axisxtickculling: '@',
        c3axisxtickcullingmax: '@',
        c3axisxtickcount: '@',
        c3axisxtickfit: '@',        
        c3axisxtickvalues: '@',
        c3axisxtickrotate: '@',
        c3axisxtickouter: '@',
        //c3axisxtickmultiline: '@', -- not supported by c3 yet
        //c3axisxtickwidth: '@', -- not supported by c3 yet
        c3axisxmax: '@',
        c3axisxmin: '@',
        c3axisxpadding: '@',
        c3axisxheight: '@',
        c3axisxextent: '@',
        c3axisxlabel: '@',
        //axis.y
        c3axisyshow: '@',
        //c3axisytype: '@',
        c3axisyinner: '@',
        c3axisymax: '@',
        c3axisymin: '@',
        c3axisyinverted: '@',
        c3axisycenter: '@',
        c3axisylabel: '@',
        c3axisytickformat: '@',
        c3axisytickouter: '@',
        c3axisytickvalues: '@',
        c3axisytickcount: '@',
        //c3axisyticktimevalue: '@',
        //c3axisyticktimeinterval: '@',
        c3axisypadding: '@',
        c3axisydefault: '@',
        c3axisy2show: '@',
        c3axisy2inner: '@',
        c3axisy2max: '@',
        c3axisy2min: '@',
        c3axisy2inverted: '@',
        c3axisy2center: '@',
        c3axisy2label: '@',
        c3axisy2tickformat: '@',
        c3axisy2tickouter: '@',
        c3axisy2tickvalues: '@',
        c3axisy2tickcount: '@',
        c3axisy2padding: '@',
        c3axisy2default: '@',
        
        c3gridylines: '@',
        c3barwidth: '@',
        c3barwidthratio: '@'
        
       
      },
      link: mmsChartLink
    }; //return
}



