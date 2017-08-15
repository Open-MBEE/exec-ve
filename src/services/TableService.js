'use strict';

angular.module('mms')
  .factory('TableService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', '_', 'ElementService', TableService]);

function TableService($q, $http, URLService, UtilsService, CacheService, _, ElementService) {

        var readTable = function(reqOb) {
      var deferred = $q.defer();

    
      var tableColumnHeadersLabels=[];
      var i, j, k;
      //assuming td.type = "Table";
      if ( reqOb.tableData.header !== undefined){
        for (i = 1; i < reqOb.tableData.header[0].length; i++ ){
          tableColumnHeadersLabels.push(reqOb.tableData.header[0][i].content[0].text.replace("<p>","").replace("</p>","").replace(" ", ""));    
        }
       }
      var rowHeadersMmsEid = [];
      rowHeadersMmsEid.elementIds =[];
      rowHeadersMmsEid.projectId = reqOb.projectId;
      rowHeadersMmsEid.refId = reqOb.refId;
      rowHeadersMmsEid.commitId = reqOb.commitId;
      var dataValuesMmmEid = [];
      dataValuesMmmEid.elementIds = [];
      dataValuesMmmEid.projectId = reqOb.projectId;
      dataValuesMmmEid.refId = reqOb.refId;
      dataValuesMmmEid.commitId = reqOb.commitId;

      var numOfDataColumn; 
      
      for ( i = 0; i < reqOb.tableData.body.length; i++){ 
        rowHeadersMmsEid.elementIds.push(reqOb.tableData.body[i][0].content[0].source);
        for ( j = 1; j < reqOb.tableData.body[i].length; j++ ){
          dataValuesMmmEid.elementIds.push(reqOb.tableData.body[i][j].content[0].source);
        }
        if (i === 0)
          numOfDataColumn = reqOb.tableData.body[i].length - 1; //-1 to remove row header
      }
      var numOfRowHeadersPerTable = reqOb.tableData.body.length;
      readTablesCommon();
    
        function readTablesCommon(){
          
          ElementService.getElements(rowHeadersMmsEid, 1, false)
          .then(function(rowHeaders) {
              ElementService.getElements(dataValuesMmmEid, 1, false)
                .then(function(values) {
                  var dataIdFilters=[];
                  var dataTableValues = [];
                  var datavalues = [];
                  var startIndex = 0;
                  var counter = 0;
                  
                  var valueLength = numOfDataColumn* numOfRowHeadersPerTable;//rowHeadersMmsEid.length;
                  for (var i = 0; i < valueLength; i= i + numOfDataColumn){
                    var datarow =[];// new Array(tableColumnHeadersLabels[k].length);
                    for ( var j = 0; j < numOfDataColumn; j++){
                      datarow.push(values[counter++]); 
                    }
                    datavalues.push(datarow);
                  }

                  var eachRowHeader =[];
                    counter = 0;
                    for ( i = 0; i < numOfRowHeadersPerTable; i++){
                      eachRowHeader.push(rowHeaders[counter++]);
                    }
                  var r =  {
                     tableColumnHeadersLabels: tableColumnHeadersLabels, //[]
                     tableRowHeaders: eachRowHeader,
                     datavalues: datavalues, //[][] - array
                  };
                deferred.resolve(r);
            });//ElementService.getElements - dataValuesMmEid
          });//ElementService.getElements - rowHeadersMmsEid
        } //end of readTableCommon function
     
      return deferred.promise;
    }; //end of readTable

    return {
        readTable: readTable
    };

}
