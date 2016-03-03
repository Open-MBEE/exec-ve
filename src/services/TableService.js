'use strict';

angular.module('mms')
  .factory('TableService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', '_', 'ElementService', TableService]);

function TableService($q, $http, URLService, UtilsService, CacheService, _, ElementService) {
   
   //make only a-zA-Z0-9_ because id or class does not support special characters(ie., ())
    var toValidId = function(original) { 
        return original.replace(/[^a-zA-Z0-9_]/gi, '');
    };
  
    var readTables = function(mmsEid, ws, version) {
      var deferred = $q.defer();  
      
      ElementService.getElement(mmsEid, false, ws, version)
      .then(function(data) {
        
        var tableTitles = []; //used only for display
        var tableIds = []; //used as filter id
        var tableColumnHeadersLabels=[];
        var numOfRowHeadersPerTable = [];
        var rowHeadersMmsEid = []; 
        var dataValuesMmmEid =[];

        var i, j, k;
        if ( data.specialization.contents !==  undefined){ //use contents if exist
        //if ( data.specialization.contains ===  undefined){  
          var tempMmsEid = [];
          for ( k = 0; k < data.specialization.contents.operand.length; k++ ){
            tempMmsEid.push(data.specialization.contents.operand[k].instance);
          }
          ElementService.getElements(tempMmsEid, false, ws, version)
            .then(function(values) {
              for ( k = 0; k < values.length; k++){
                var s = JSON.parse(values[k].specialization.instanceSpecificationSpecification.string);
                if ( s.type === "Table"){
                  tableTitles.push(s.title !== undefined ? s.title : "");
                  tableIds.push(values[k].sysmlid);
                  var columnHeaders = [];
                  //ignore 1st column
                  for (i = 1; i < s.header[0].length; i++ ){
                    columnHeaders.push(s.header[0][i].content[0].text.replace("<p>","").replace("</p>","").replace(" ", ""));    
                  }
                  tableColumnHeadersLabels.push(columnHeaders);
                  var rowHeaders = [];
                  numOfRowHeadersPerTable.push(s.body.length);
                  for ( i = 0; i < s.body.length; i++){
                    rowHeadersMmsEid.push(s.body[i][0].content[0].source);
                    for ( j = 1; j < s.body[i].length; j++ ){
                      dataValuesMmmEid.push(s.body[i][j].content[0].source);
                    }
                  }
                }
              }
              readTablesCommon();
            });
        }
        else {
          var tableContains = [];
          for ( k = 0; k < data.specialization.contains.length; k++ ){
            if ( data.specialization.contains[k].type ==="Table"){
              //use table title or text before the table as tableTitles
              if ( data.specialization.contains[k].title !== undefined &&  data.specialization.contains[k].title.length !== 0)
                tableTitles.push(toValidId(data.specialization.contains[k].title)); 
              else if ( data.specialization.contains[k-1].sourceType==="text")
                tableTitles.push(toValidId(data.specialization.contains[k-1].text.replace("<p>","").replace("</p>","").replace(" ", ""))); //assume it is Paragraph
              else
                tableTitles.push("");

              tableIds.push("_" + Math.floor((Math.random() * 1000) + 1)); //a random between 1 and 1000
              tableContains.push(data.specialization.contains[k]);
              var columnHeaders = [];
              //assume first column is empty
              for ( var kk = 1; kk < data.specialization.contains[k].header[0].length; kk++){
                columnHeaders[kk-1] = data.specialization.contains[k].header[0][kk].content[0].text.replace("<p>","").replace("</p>","");
              }  
              tableColumnHeadersLabels.push(columnHeaders); //xxx, yyy, mass,cost, power in string
            }
          }
          var body;
          for ( k = 0; k < tableContains.length; k++){
              body = tableContains[k].body;
              numOfRowHeadersPerTable.push( body.length);
              for (i = 0; i < body.length; i++ ){
                rowHeadersMmsEid.push(body[i][0].content[0].source);
                for ( j = 1; j < body[i].length; j++){
                  dataValuesMmmEid.push(body[i][j].content[0].source);
              }
            }
          }
          readTablesCommon();
        }
        
        //requires numOfRowHeadersPerTable, rowHeadersMmsEid, dataValuesMmmEid, tableIds(to get number of tables)
        //common function to read 2.2 and previous version JSON
        function readTablesCommon(){
          var numOfTables = tableIds.length;
          ElementService.getElements(rowHeadersMmsEid, false, ws, version)
          .then(function(rowHeaders) {
              ElementService.getElements(dataValuesMmmEid, false, ws, version)
                  .then(function(values) {
                    var dataIdFilters=[];
                    var dataTableValues = [];
                    var datavalues = [];
                    var startIndex = 0;
                    var counter = 0;
                    for (k = 0; k < numOfTables; k++){
                    //for (k = 0; k < tableContains.length; k++){
                    datavalues = [];
                    var valueLength = tableColumnHeadersLabels[k].length* numOfRowHeadersPerTable[k];//rowHeadersMmsEid.length;
                    for (i = 0; i < valueLength; i= i + tableColumnHeadersLabels[k].length){
                      var datarow =[];// new Array(tableColumnHeadersLabels[k].length);
                      for ( var j = 0; j < tableColumnHeadersLabels[k].length; j++){
                        datarow.push(values[counter++]); 
                      }
                      datavalues.push(datarow);
                    }
                    dataTableValues.push(datavalues);
                  }
                  var tableRowHeaders =[];
                  var eachRowHeader;
                  counter = 0;
                  for ( k = 0; k < numOfTables; k++){ //per table
                    eachRowHeader = [];
                    for ( i = 0; i < numOfRowHeadersPerTable[k]; i++){
                      eachRowHeader.push(rowHeaders[counter++]);
                    }
                    tableRowHeaders.push(eachRowHeader);
                  }
                  for (k = 0; k < numOfTables; k++){
                    var filters = [];
                    var filterRowHeaders = [];
                    var filterColumnHeaders=[];
                    for ( i = 0; i < tableRowHeaders[k].length; i++){
                         filterRowHeaders[toValidId(tableRowHeaders[k][i].name)] = true;
                    }
                    for ( i = 0; i < tableColumnHeadersLabels[k].length; i++){
                       filterColumnHeaders[toValidId(tableColumnHeadersLabels[k][i])] = true;
                    }
                    filters.push(filterRowHeaders);
                    filters.push(filterColumnHeaders);
                    dataIdFilters[tableIds[k]]=filters;
                  }
                  var r =  {
                     tableTitles: tableTitles,
                     tableIds: tableIds,//[]ss
                     tableColumnHeadersLabels: tableColumnHeadersLabels, //[]
                     tableRowHeaders: tableRowHeaders,
                     datavalues: dataTableValues, //[][] - array
                     dataIdFilters: dataIdFilters
                  };
                deferred.resolve(r);
            });//ElementService.getElements - dataValuesMmEid
          });//ElementService.getElements - rowHeadersMmsEid
        } //end of function 
       
        
      }); //end of ElementService
      return deferred.promise;
    }; //end of getTables


    return {
        readTables: readTables,
        toValidId: toValidId
    };

}