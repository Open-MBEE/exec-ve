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
          //columns:  _columns, //including column heading
        }
      };
      
      if (scope.c3dataurl){
        c3json.data.url = scope.c3dataurl;
      }
      else if (scope.c3datajson){
        c3json.data.json = JSON.parse( scope.c3datajson.replace(/'/g, '"'));
      }
      else if (scope.c3datarows){
        c3json.data.rows = eval("(" + scope.c3datarows + ")");
      }
      else if (scope.c3datacolumns){
        c3json.data.columns = eval("(" + scope.c3datacolumns + ")");
      }
      else {
         if (scope.c3tablereverse){
          c3json.data.rows = _columns;
        }
        else { //data from table
          c3json.data.columns = _columns;
        }
        if(_has_column_header === true && scope.c3dataxs === undefined && scope.c3axisxcategories === undefined)
          c3json.data.x = 'x'; 
      }
      //Chart
      if ( scope.c3sizewidth){
        if (c3json.size === undefined) c3json.size = {};
        c3json.size.width = eval("(" + scope.c3sizewidth + ")");
      }
      if ( scope.c3sizeheight){
        if (c3json.size === undefined) c3json.size = {};
        c3json.size.height = eval("(" + scope.c3sizeheight + ")");
      }
      if ( scope.c3paddingtop){
        if (c3json.padding === undefined) c3json.padding = {};
        c3json.padding.top = eval("(" + scope.c3paddingtop + ")");
      }
      if ( scope.c3paddingright){
        if (c3json.padding === undefined) c3json.padding = {};
        c3json.padding.right = eval("(" + scope.c3paddingright + ")");
      }
      if ( scope.c3paddingbottom){
        if (c3json.padding === undefined) c3json.padding = {};
        c3json.padding.bottom = eval("(" + scope.c3paddingbottom + ")");
      }
      if ( scope.c3paddingleft){
        if (c3json.padding === undefined) c3json.padding = {};
        c3json.padding.left = eval("(" + scope.c3paddingleft + ")");
      }
      if ( scope.c3colorpattern){
        if (c3json.color === undefined) c3json.color = {};
        c3json.color.pattern = eval("(" + scope.c3colorpattern + ")");
      }
      if ( scope.c3interactionenabled){
        if (c3json.interaction === undefined) c3json.interaction = {};
        c3json.interaction.enabled = eval("(" + scope.c3interactionenabled + ")");
      }
      if ( scope.c3transitionduration){
        if (c3json.transition === undefined) c3json.transition = {};
        c3json.transition.duration = eval("(" + scope.c3transitionduration + ")");
      }
      if ( scope.c3oninit){
        c3json.oninit = eval("(" + scope.c3oninit + ")");
      }
      if ( scope.c3onrendered){
        c3json.onrendered = eval("(" + scope.c3onrendered + ")");
      }
      if ( scope.c3onmouseover){
        c3json.onmouseover = eval("(" + scope.c3onmouseover + ")");
      }
      if ( scope.c3onmouseout){
        c3json.onmouseout = eval("(" + scope.c3onmouseout + ")");
      }
      if ( scope.c3onresize){
        c3json.onresize = eval("(" + scope.c3onresize + ")");
      }
      if ( scope.c3onresized){
        c3json.onresized = eval("(" + scope.c3onresized + ")");
      }
      //Data
      if (scope.c3dataxs)
        c3json.data.xs = JSON.parse( scope.c3dataxs.replace(/'/g, '"'));
      if (scope.c3dataxformat)
        c3json.data.xFormat = scope.c3dataxformat;
      
      if ( scope.c3datatype !== undefined) 
        c3json.data.type = scope.c3datatype;
      if ( scope.c3datatypes !== undefined ) {//mix, scope.c3datatypes defined
        //{'a1':'step', 'a2':'area-step'}
        //to
        //{"a1":"step", "a2":"area-step"}
        c3json.data.types = JSON.parse( scope.c3datatypes.replace(/'/g, '"'));
      }
      if (scope.c3datagroups !== undefined){
        c3json.data.groups = JSON.parse( scope.c3datagroups.replace(/'/g, '"'));
      }
      if ( scope.c3dataregions !== undefined){
        //modify
        // {'a1':[{'start':1, 'end':2, 'style':'dashed'},{'start':3}],'a2':[{'end':3}]}
        //to 
        //{"a1":[{"start":1, "end":2, "style":"dashed"},{"start":3}],"a2":[{"end":3}]}
        c3json.data.regions = JSON.parse(scope.c3dataregions.replace(/'/g, '"'));
      }
      if (scope.c3datamimetype)
        c3json.data.mimetype = scope.c3datamimetype;
      if (scope.c3datakeys)
        c3json.data.keys = JSON.parse(scope.c3datakeys.replace(/'/g, '"'));
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
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.show = eval("(" + scope.c3axisxshow  + ")");
      }
      if (scope.c3axisxtype){ //timeseries, category, or indexed
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.type = scope.c3axisxtype; 
      }
      else if (_has_column_header === true && _is_x_value_number === false && scope.c3dataxs === undefined){ //row 1 is heading but not numbers (column0 is ignored)
           if (c3json.axis === undefined)  c3json.axis = {};
           if (c3json.axis.x === undefined) c3json.axis.x = {};
           c3json.axis.x.type = 'category';
      }
      if (scope.c3axisxlocaltime){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.localtime = eval("(" + scope.c3axisxlocaltime + ")");
      }
      if (scope.c3axisxcategories){ //['a1', 'b1']
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        c3json.axis.x.categories = eval("(" + scope.c3axisxcategories + ")");
        //remove x from data.columns: [[x, column1, column2....], [a1, 1,2,3]...] 
        //x is created from column header
        if (c3json.data.columns[0][0] === 'x')
          c3json.data.columns.shift();
      }
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
      if (scope.c3axisxtickculling){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.x === undefined) c3json.axis.x = {};
        if (c3json.axis.x.tick === undefined) c3json.axis.x.tick = {};
         c3json.axis.x.tick.culling = eval("(" + scope.c3axisxtickculling  + ")");
      }
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
      if (scope.c3axisy2max){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        c3json.axis.y2.max = scope.c3axisy2max;
      }
      if (scope.c3axisy2min){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        c3json.axis.y2.min = scope.c3axisy2min;
      }    
      if (scope.c3axisy2inverted){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        c3json.axis.y2.inverted = scope.c3axisy2inverted;
      }  
      if (scope.c3axisy2center){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        c3json.axis.y2.center = scope.c3axisy2center;
      }
      if ( scope.c3axisy2label !== undefined){
          if (c3json.axis === undefined) c3json.axis = {};
          if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
          if (scope.c3axisy2label.startsWith("{"))
            c3json.axis.y2.label = JSON.parse(scope.c3axisy2label.replace(/'/g, '"')); 
          else
            c3json.axis.y2.label = scope.c3axisy2label;
      } 
      if (scope.c3axisy2tickformat){//function(d){}
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        if (c3json.axis.y2.tick === undefined) c3json.axis.y2.tick = {};
        if (scope.c3axisy2tickformat.trim().startsWith("function"))
          c3json.axis.y2.tick.format = eval("(" + scope.c3axisy2tickformat + ")");
        else if (scope.c3axisy2tickformat.indexOf('%') !== -1)
          c3json.axis.y2.tick.format = scope.c3axisy2tickformat;
      }
      if (scope.c3axisy2tickouter){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        if (c3json.axis.y2.tick === undefined) c3json.axis.y2.tick = {};
        c3json.axis.y2.tick.outer = eval("(" + scope.c3axisy2tickouter + ")");
      }
      if (scope.c3axisy2tickvalues){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        if (c3json.axis.y2.tick === undefined) c3json.axis.y2.tick = {};
        c3json.axis.y2.tick.values = eval("(" + scope.c3axisy2tickvalues + ")");
      }  
      if (scope.c3axisy2tickcount){ 
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        if (c3json.axis.y2.tick === undefined) c3json.axis.y2.tick = {};
        c3json.axis.y2.tick.count = scope.c3axisy2tickcount;
      }  
        //c3axisyticktimevalue: '@',
        //c3axisyticktimeinterval: '@',
      if (scope.c3axisy2padding){ //{'top': '0', 'bottom': '0'}
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        c3json.axis.y2.padding = JSON.parse( scope.c3axisy2padding.replace(/'/g, '"')); 
      }  
      if (scope.c3axisy2default){
        if (c3json.axis === undefined) c3json.axis = {};
        if (c3json.axis.y2 === undefined) c3json.axis.y2 = {};
        if (c3json.axis.y2.tick === undefined) c3json.axis.y2.tick = {};
        c3json.axis.y2.default = eval("(" + scope.c3axisy2default + ")");
      }   
    //Grid 
      if ( scope.c3gridxshow){ //boolen
        if (c3json.grid === undefined) c3json.grid = {};
        if (c3json.grid.x === undefined) c3json.grid.x = {};
        c3json.grid.x.show = eval("(" + scope.c3gridxshow  + ")");
      }  
      if ( scope.c3gridxlines !== undefined){ //[{value:2, text:'label2'}, {...},{...}]
        if (c3json.grid === undefined) c3json.grid = {};
        if (c3json.grid.x === undefined) c3json.grid.x = {};
        c3json.grid.x.lines = JSON.parse( scope.c3gridxlines.replace(/'/g, '"'));
      }
      if ( scope.c3gridyshow){ //boolen
        if (c3json.grid === undefined) c3json.grid = {};
        if (c3json.grid.y === undefined) c3json.grid.y = {};
        c3json.grid.y.show = eval("(" + scope.c3gridyshow  + ")");
      } 
      if ( scope.c3gridylines !== undefined){ //[{value:2, text:'label2'}, {...},{...}]
        if (c3json.grid === undefined) c3json.grid = {};
        if (c3json.grid.y === undefined) c3json.grid.y = {};
        c3json.grid.y.lines = JSON.parse( scope.c3gridylines.replace(/'/g, '"'));
      }
      //c3gridyticks: '@', - not implemented in c3
      //c3gridfocusshow: '@',- not implemented in c3
      //c3gridlinesfront: '@',- not implemented in c3
      if ( scope.c3legendshow){ //boolen
        if (c3json.legend === undefined) c3json.legend = {};
        c3json.legend.show = eval("(" + scope.c3legendshow  + ")");
      } 
      if ( scope.c3legendhide){ //boolen, string(c3legendhide="'data1'") or array(['data1', 'data2'])
        if (c3json.legend === undefined) c3json.legend = {};
        c3json.legend.hide = eval("(" + scope.c3legendhide  + ")");
      } 
      if ( scope.c3legendposition){ //c3datalegendposition = "bottom" //  "right" or "inset"
        if (c3json.legend === undefined) c3json.legend = {};
        c3json.legend.position = scope.c3legendposition ; 
      } 
      /* c3legendinset = 
          "{'anchor': 'top-right',
            'x': 20,
            'y': 10,
            'step': 2 }"
      */
      if ( scope.c3legendinset){ 
        if (c3json.legend === undefined) c3json.legend = {};
        c3json.legend.inset = JSON.parse( scope.c3legendinset.replace(/'/g, '"')); 
      } 
      if (scope.c3legenditemonclick){ //function(d){...}
        if (c3json.legend === undefined) c3json.legend = {};
        if (c3json.legend.item === undefined) c3json.legend.item = {};
        c3json.legend.item.onclick = eval("(" + scope.c3legenditemonclick + ")");
      }
      if (scope.c3legenditemonmouseover){
        if (c3json.legend === undefined) c3json.legend = {};
        if (c3json.legend.item === undefined) c3json.legend.item = {};
        c3json.legend.item.onmouseover = eval("(" + scope.c3legenditemonmouseover + ")");
      }
      if (scope.c3legenditemonmouseout){
        if (c3json.legend === undefined) c3json.legend = {};
        if (c3json.legend.item === undefined) c3json.legend.item = {};
        c3json.legend.item.onmouseout = eval("(" + scope.c3legenditemonmouseout + ")");
      }
      //Tooltip
      if ( scope.c3tooltipshow){ //boolen, string(c3legendhide="'data1'") or array(['data1', 'data2'])
        if (c3json.tooltip === undefined) c3json.tooltip = {};
        c3json.tooltip.show = eval("(" + scope.c3tooltipshow  + ")");
      }
      if ( scope.c3tooltipgrouped){ //boolen, string(c3legendhide="'data1'") or array(['data1', 'data2'])
        if (c3json.tooltip === undefined) c3json.tooltip = {};
        c3json.tooltip.grouped = eval("(" + scope.c3tooltipgrouped  + ")");
      } 
      if (scope.c3tooltipformattitle){ //function(d){...}
        if (c3json.tooltip === undefined) c3json.tooltip = {};
        if (c3json.tooltip.format === undefined) c3json.tooltip.format = {};
        c3json.tooltip.format.title = eval("(" + scope.c3tooltipformattitle + ")");
      }
      if (scope.c3tooltipformatname){ //function(d){...}
        if (c3json.tooltip === undefined) c3json.tooltip = {};
        if (c3json.tooltip.format === undefined) c3json.tooltip.format = {};
        c3json.tooltip.format.name = eval("(" + scope.c3tooltipformatname + ")");
      }
      if (scope.c3tooltipformatvalue){ //function(d){...}
        if (c3json.tooltip === undefined) c3json.tooltip = {};
        if (c3json.tooltip.format === undefined) c3json.tooltip.format = {};
        c3json.tooltip.format.value = eval("(" + scope.c3tooltipformatvalue + ")");
      }
      if (scope.c3tooltipposition){ //function(d){...}
        if (c3json.tooltip === undefined) c3json.tooltip = {};
        c3json.tooltip.position = eval("(" + scope.c3tooltipposition + ")");
      }
      if (scope.c3tooltipcontents){ //function(d){...}
        if (c3json.tooltip === undefined) c3json.tooltip = {};
        c3json.tooltip.contents = eval("(" + scope.c3tooltipcontents + ")");
      }
      //Point
      if ( scope.c3pointshow){ //boolen
        if (c3json.point === undefined) c3json.point = {};
        c3json.point.show = eval("(" + scope.c3pointshow  + ")");
      } 
      if ( scope.c3pointr){ // number
        if (c3json.point === undefined) c3json.point = {};
        c3json.point.r = eval("(" + scope.c3pointr  + ")");
      } 
      if ( scope.c3pointfocusexpandenabled){ //boolen
        if (c3json.point === undefined) c3json.point = {};
        if (c3json.point.focus === undefined) c3json.point.focus = {};
        if (c3json.point.focus.expand === undefined) c3json.point.focus.expand = {};
        c3json.point.focus.expand.enabled = eval("(" + scope.c3pointfocusexpandenabled  + ")");
      } 
      if ( scope.c3pointfocusexpandr){ //number
        if (c3json.point === undefined) c3json.point = {};
        if (c3json.point.focus === undefined) c3json.point.focus = {};
        if (c3json.point.focus.expand === undefined) c3json.point.focus.expand = {};
        c3json.point.focus.expand.r = eval("(" + scope.c3pointfocusexpandr  + ")");
      } 
      if ( scope.c3pointselectr){ // number
        if (c3json.point === undefined) c3json.point = {};
        if (c3json.point.select === undefined) c3json.point.select = {};
        c3json.point.select.r = eval("(" + scope.c3pointselectr  + ")");
      } 
      //Line
      if ( scope.c3lineconnectnull){ //boolen
        if (c3json.line === undefined) c3json.line = {};
        c3json.connectNull = eval("(" + scope.c3lineconnectnull  + ")");
      }   
      //seems not working.  Get error step not defined
      if ( scope.c3linesteptype){ // number
        if (c3json.line === undefined) c3json.line = {};
        c3json.line.step_type = eval("(" + scope.c3linesteptype  + ")");
      }
      if ( scope.c3areazerobased){ // number
        if (c3json.area === undefined) c3json.area = {};
        c3json.area.zerobased = eval("(" + scope.c3areazerobased  + ")");
      }
      //bar - width or ratio
      if ( scope.c3barwidth !== undefined){
        if (c3json.bar === undefined ) c3json.bar = {};
        if (c3json.bar.width === undefined) c3json.bar.width = {};
        c3json.bar.width = scope.c3barwidth;
      } 
      if ( scope.c3barwidthratio !== undefined){
        if (c3json.bar === undefined ) c3json.bar = {};
        if (c3json.bar.width === undefined) c3json.bar.width = {};
        c3json.bar.width.ratio = scope.c3barwidthratio;
      }
      if ( scope.c3barzerobased){ // number
        if (c3json.bar === undefined ) c3json.bar = {};
        c3json.bar.zerobased = eval("(" + scope.c3barzerobased  + ")");
      }
      //Pie
      if ( scope.c3pielabelshow){ 
        if (c3json.pie === undefined ) c3json.pie = {};
        if (c3json.pie.label === undefined ) c3json.pie.label = {};
        c3json.pie.label.show = eval("(" + scope.c3pielabelshow  + ")");
      }
      if ( scope.c3pielabelformat){ 
        if (c3json.pie === undefined ) c3json.pie = {};
        if (c3json.pie.label === undefined ) c3json.pie.label = {};
        c3json.pie.label.format = eval("(" + scope.c3pielabelformat  + ")");
      }
      if ( scope.c3pielabelthreshold){ 
        if (c3json.pie === undefined ) c3json.pie = {};
        if (c3json.pie.label === undefined ) c3json.pie.label = {};
        c3json.pie.label.threshold = eval("(" + scope.c3pielabelthreshold  + ")");
      }
      if ( scope.c3pieexpand){ 
        if (c3json.pie === undefined ) c3json.pie = {};
        c3json.pie.expand = eval("(" + scope.c3pieexpand  + ")");
      }
      //Donut
      if ( scope.c3donutlabelshow){ 
        if (c3json.donut === undefined ) c3json.donut = {};
        if (c3json.donut.label === undefined ) c3json.donut.label = {};
        c3json.donut.label.show = eval("(" + scope.c3donutlabelshow  + ")");
      }
      if ( scope.c3donutlabelformat){ 
        if (c3json.donut === undefined ) c3json.donut = {};
        if (c3json.donut.label === undefined ) c3json.donut.label = {};
        c3json.donut.label.format = eval("(" + scope.c3donutlabelformat  + ")");
      }
      if ( scope.c3donutlabelthreshold){ 
        if (c3json.donut === undefined ) c3json.donut = {};
        if (c3json.donut.label === undefined ) c3json.donut.label = {};
        c3json.donut.label.threshold = eval("(" + scope.c3donutlabelthreshold  + ")");
      }
      if ( scope.c3donutexpand){ 
        if (c3json.donut === undefined ) c3json.donut = {};
        c3json.donut.expand = eval("(" + scope.c3donutexpand  + ")");
      }
      if ( scope.c3donutwidth){ 
        if (c3json.donut === undefined ) c3json.donut = {};
        c3json.donut.width = eval("(" + scope.c3donutwidth  + ")");
      }
      if ( scope.c3donuttitle){ 
        if (c3json.donut === undefined ) c3json.donut = {};
        c3json.donut.title = scope.c3donuttitle;
      }
      //Gauge
      if ( scope.c3gaugelabelshow){ 
        if (c3json.gauge === undefined ) c3json.gauge = {};
        if (c3json.gauge.label === undefined ) c3json.gauge.label = {};
        c3json.gauge.label.show = eval("(" + scope.c3gaugelabelshow  + ")");
      }
      if ( scope.c3gaugelabelformat){ 
        if (c3json.gauge === undefined ) c3json.gauge = {};
        if (c3json.gauge.label === undefined ) c3json.gauge.label = {};
        c3json.gauge.label.format = eval("(" + scope.c3gaugelabelformat  + ")");
      }
      if ( scope.c3gaugeexpand){ 
        if (c3json.gauge === undefined ) c3json.gauge = {};
        c3json.gauge.expand = eval("(" + scope.c3gaugeexpand  + ")");
      }
      if ( scope.c3gaugemin){ 
        if (c3json.gauge === undefined ) c3json.gauge = {};
        c3json.gauge.min = eval("(" + scope.c3gaugemin  + ")");
      }
      if ( scope.c3gaugemax){ 
        if (c3json.gauge === undefined ) c3json.gauge = {};
        c3json.gauge.max = eval("(" + scope.c3gaugemax  + ")");
      }
      if ( scope.c3gaugeunits){ 
        if (c3json.gauge === undefined ) c3json.gauge = {};
        c3json.gauge.units = scope.c3gaugeunits;
      }
      if ( scope.c3gaugewidth){ 
        if (c3json.gauge === undefined ) c3json.gauge = {};
        c3json.gauge.width = eval("(" + scope.c3gaugewidth  + ")");
      }
   
    var json = JSON.stringify(c3json);
    console.log(json);
    var chart = c3.generate(c3json);
    
    /*var zz2 = {bindto:'#c3chart' + _index ,
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
    */

	}//end of vf_pplot()

  scope.render = function() {

    if (scope.mmsEid === undefined) { //data is not from table
      vf_pplot([], 0, false, false);
      return;
    }
    svg.selectAll('*').remove();
      
	
	var is_x_value_number = true;  //column headings are number (not check 1st column)
  var has_column_header;
  var start_index; //0 if column header is included as data, -1 if column header is not included as data
  for ( var k = 0; k < scopeTableIds.length; k++){
		var c3_data=[];

    if (scopetableColumnHeadersLabel[k] === undefined) {//no column header 
        has_column_header = false;
        start_index = -1;    
    }
    else if ( scope.c3dataxs === undefined) {
      c3_data[0] = ['x'].concat(scopetableColumnHeadersLabel[k]);
      start_index = 0;
      has_column_header = true;
    }
    else {//Assume if xs is defined, column header is ignored even exist
      has_column_header = false;
      start_index = -1;
    }
    if (scopetableColumnHeadersLabel[k] !== undefined && isNaN(scopetableColumnHeadersLabel[k][0]))
      is_x_value_number = false;

    for ( var i = 0; i < scope.datavalues[k].length; i++){
	     var c3_data_row=[];
       
      for ( var j = 0; j < scope.datavalues[k][i].length; j++){
        var datavalue = null;
        if (scope.datavalues[k][i][j].type === "Property" || scope.datavalues[k][i][j].type === "Port")
          datavalue = scope.datavalues[k][i][j].defaultValue;
        else if (scope.datavalues[k][i][j].type === "Slot")
          datavalue = scope.datavalues[k][i][j].value[0];
        if (datavalue && datavalue.type === "LiteralString")
          c3_data_row[j] = Number(datavalue.value);
        else if (datavalue && (datavalue.type === "LiteralReal" || datavalue.type === "LiteralInteger"))
          c3_data_row[j] = datavalue.value;
      } //end of j
     	c3_data[1+start_index++] = [scope.tableRowHeaders[k][i].name].concat(c3_data_row);
    } //end of i
    
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
        c3tablereverse: '@',
        c3sizewidth: '@',
        c3sizeheight: '@',
        c3paddingtop: '@',
        c3paddingright: '@',
        c3paddingbottom: '@',
        c3paddingleft: '@',
        c3colorpattern: '@',
        c3interactionenabled: '@',
        c3transitionduration: '@',
        c3oninit: '@',
        c3onrendered: '@',
        c3onmouseover: '@',
        c3onmouseout: '@',
        c3onresize: '@',
        c3onresized: '@',
        c3dataurl: '@',
        c3datajson: '@',
        c3datarows: '@',
        c3datacolumns: '@',
        c3datamimetype: '@',
        c3datakeys: '@',
        c3datax: '@',
        c3dataxs: '@',
        c3dataxformat: '@',
        //c3dataxlocaltime: '@',//
        //c3dataxsort: '@',//
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
        c3datacolor: '@',
        c3datacolors: '@',
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
      //Axis.x
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
      //Axis.y
        c3axisyshow: '@',
        //c3axisytype: '@',-- not supported by c3 yet
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
        //c3axisyticktimevalue: '@',-- not supported by c3 yet
        //c3axisyticktimeinterval: '@',-- not supported by c3 yet
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
      //Grid
        c3gridxshow: '@',
        c3gridxlines: '@',
        c3gridyshow: '@',
        c3gridylines: '@',
        //c3gridyticks: '@',- not implemented in c3
        //c3gridfocusshow: '@',- not implemented in c3
        //c3gridlinesfront: '@',- not implemented in c3
      //Regions
        //c3regions: '@', - css change required to use the regions
      //Legend 
        c3legendshow: '@',
        c3legendhide: '@',
        c3legendposition: '@',
        c3legendinset: '@',
        c3legenditemonclick: '@',
        c3legenditemonmouseover: '@',
        c3legenditemonmouseout: '@',
       //Tooltip
        c3tooltipshow: '@',
        c3tooltipgrouped: '@',
        c3tooltipformattitle: '@',
        c3tooltipformatname: '@',
        c3tooltipformatvalue: '@',
        c3tooltipposition: '@',
        c3tooltipcontents: '@',
      //Point
        c3pointshow: '@',
        c3pointr: '@',
        c3pointfocusexpandenabled: '@',
        c3pointfocusexpandr: '@',
        c3pointselectr: '@',
      //Line
        c3lineconnectnull: '@',
        c3linesteptype: '@',
      //Area
        c3areazerobased: '@',
      //Bar  
        c3barwidth: '@',
        c3barwidthratio: '@',
        c3barzerobased: '@',
      //Pie
        c3pielabelshow: '@',
        c3pielabelformat: '@',
        c3pielabelthreshold: '@',
        c3pieexpand: '@',
      //Donut
        c3donutlabelshow: '@',
        c3donutlabelformat: '@',
        c3donutlabelthreshold: '@',
        c3donutexpand: '@',
        c3donutwidth: '@',
        c3donuttitle: '@',
      //Gauge  
        c3gaugelabelshow: '@',
        c3gaugelabelformat: '@',
        c3gaugeexpand: '@',
        c3gaugemin: '@',
        c3gaugemax: '@',
        c3gaugeunits: '@',
        c3gaugewidth: '@'
      },
      link: mmsChartLink
    }; //return
}



