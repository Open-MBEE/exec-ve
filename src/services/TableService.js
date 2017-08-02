'use strict';

angular.module('mms')
  .factory('TableService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', '_', 'ElementService', TableService]);

function TableService($q, $http, URLService, UtilsService, CacheService, _, ElementService) {

   //make only a-zA-Z0-9_ because id or class does not support special characters(ie., ())
    var toValidId = function(original) {
        return original.replace(/[^a-zA-Z0-9_]/gi, '');
    };

    /*
     * Generic read table function that returns column arrays keyed to labels
     * from the first row
     *
     * @param {string} mmsEid SysML ID of a table instance
     */
    var readTableCols = function(reqOb, ws, version) {
      var deferred = $q.defer();
      //ElementService.getElement(mmsEid, false, ws, version)
      ElementService.getElement(reqOb, 1, true)
      .then(function(data) {
        var ids = [];
        var columns = [];
        var keys = [];

        data = JSON.parse(data.specialization.instanceSpecificationSpecification.string);

        var headers = data.header[0].map(function(val) {
          // Why is HTML being injected by MagicDraw in the first place?
          return val.content[0].text.replace('<p>', '').replace('</p>', '');
        });

        var title = data.title;

        // rotate row-based 2D array into col-based 2D array
        ids = _.unzip(data.body).map(function(col) {
          return col.map(function(cell) {
            // extract only the SysML ID
            return cell.content[0].source;
          });
        });

        var promises = [];
        ids.forEach(function(col, i) {
          columns[i] = [];
          promises.push(ElementService.getElements(col, false, ws, version)
          .then(function(data) {
            data.forEach(function(cell) {
              var val;
              // LiteralReal => double
              // Number, integer, etc.?
              if (typeof cell.specialization.value !== 'undefined') {
                if (typeof cell.specialization.value[0].double !== 'undefined') {
                  val = cell.specialization.value[0].double;
                } else if (typeof cell.specialization.value[0].integer !== 'undefined') {
                  val = cell.specialization.value[0].integer;
                } else if (typeof cell.specialization.value[0].expressionBody !== 'undefined') {
                  val = cell.specialization.value[0].expressionBody[0];
                } else if (typeof cell.specialization.value[0].string !== 'undefined') {
                  val = cell.specialization.value[0].string;
                }
                if (val !== undefined) {
                  if (keys[i] === undefined) {
                    keys[i] = cell.name;
                  }
                  columns[i].push(val);
                } else {
                  // unknown value
                  console.log('No value found:');
                  console.log(cell);
                }
              }
            });
          }));
        });

        $q.all(promises).then(function(){
          // strip out non-value columns (these are just counters/indices generated from the row name)
          var cc = columns.length - 1;
          while (cc >= 0) {
            if (columns[cc].length === 0) {
              headers.splice(cc, 1);
              columns.splice(cc, 1);
              // no key will exist, no splicing needed from keys
            }
            cc--;
          }
          var value = {
            columns: columns,
            columnHeaders: headers,
            columnKeys: keys,
            title: title
          };
          deferred.resolve(value);
        });
      });
      return deferred.promise;
    };

    //var reqOb = {elementId: scope.mmsEid, projectId: projectId, refId: refId, commitId: commitId};
    var readTables = function(reqOb, ws, version) {
      var deferred = $q.defer();

      ElementService.getElement(reqOb, 1, false)
      .then(function(data) {

        console.log("TableService.readTables.data....");
        console.log(data);

        var tableTitles = []; //used only for display
        var tableIds = []; //used as filter id
        var tableColumnHeadersLabels=[];
        var numOfDataColumn = []; //to know the number of data columns in case not column header lables.
        var numOfRowHeadersPerTable = [];
        var rowHeadersMmsEid = [];
        rowHeadersMmsEid.elementIds =[];
        rowHeadersMmsEid.projectId = reqOb.projectId;
        rowHeadersMmsEid.refId = reqOb.refId;
        rowHeadersMmsEid.commitId = tableIds;
        var dataValuesMmmEid=[];
        dataValuesMmmEid.elementIds = [];
        dataValuesMmmEid.projectId = reqOb.projectId;
        dataValuesMmmEid.refId = reqOb.refId;
        dataValuesMmmEid.commitId = reqOb.commitId;

        var columnCounter;
        var i, j, k;

     
        if ( data._contents !==  undefined){ //use contents if exist
        //if ( data.specialization.contains ===  undefined){  
          var tempMmsEid = [];
          tempMmsEid.elementIds = [];
          //tempMmsEid.projectIds = [];
          tempMmsEid.projectId = reqOb.projectId;
          tempMmsEid.refId = reqOb.refId;
          tempMmsEid.commitId = reqOb.commitId;
          for ( k = 0; k < data._contents.operand.length; k++ ){
            tempMmsEid.elementIds.push(data._contents.operand[k].instanceId);
          }
    
          ElementService.getElements(tempMmsEid, 1, false)
            .then(function(values) {

              console.log("values...");
              console.log(values);

              for ( k = 0; k < values.length; k++){
                var s = JSON.parse(values[k].specification.value);
                if ( s.type === "Table"){
                  tableTitles.push(s.title !== undefined ? s.title : "");
                  tableIds.push(values[k].id);
                  var columnHeaders = [];
                  //ignore 1st column
                  if ( s.header !== undefined){
                    for (i = 1; i < s.header[0].length; i++ ){
                      columnHeaders.push(s.header[0][i].content[0].text.replace("<p>","").replace("</p>","").replace(" ", ""));    
                    }
                    tableColumnHeadersLabels.push(columnHeaders);
                  }
                  console.log("tableColumnHeadersLabels");
                  console.log(tableColumnHeadersLabels);
                  numOfRowHeadersPerTable.push(s.body.length);
                  for ( i = 0; i < s.body.length; i++){
                    rowHeadersMmsEid.elementIds.push(s.body[i][0].content[0].source);
                    for ( j = 1; j < s.body[i].length; j++ ){
                      dataValuesMmmEid.elementIds.push(s.body[i][j].content[0].source);
                    }
                    if (i === 0)
                      columnCounter = s.body[i].length - 1; //-1 to remove row header
                  }
                  numOfDataColumn.push(columnCounter);
                } //end of if (s.type === "Table")
              }//end of for k
              readTablesCommon();
            });
        }
 
        //requires numOfRowHeadersPerTable, rowHeadersMmsEid, dataValuesMmmEid, tableIds(to get number of tables)
        //common function to read 2.2 and previous version JSON
        function readTablesCommon(){
          var numOfTables = tableIds.length;

          ElementService.getElements(rowHeadersMmsEid, 1, false)
          .then(function(rowHeaders) {
              ElementService.getElements(dataValuesMmmEid, 1, false)
                .then(function(values) {
                  
                  var dataTableValues = [];
                  var datavalues = [];
                  var startIndex = 0;
                  var counter = 0;
                  for (k = 0; k < numOfTables; k++){
                    datavalues = [];
                    var valueLength = numOfDataColumn[k]* numOfRowHeadersPerTable[k];//rowHeadersMmsEid.length;
                    for (i = 0; i < valueLength; i= i + numOfDataColumn[k]){
                      var datarow =[];// new Array(tableColumnHeadersLabels[k].length);
                      for ( var j = 0; j < numOfDataColumn[k]; j++){
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
                    if (tableColumnHeadersLabels[k] !== undefined){
                      for ( i = 0; i < tableColumnHeadersLabels[k].length; i++){
                         filterColumnHeaders[toValidId(tableColumnHeadersLabels[k][i])] = true;
                      }
                    }
                    filters.push(filterRowHeaders);
                    filters.push(filterColumnHeaders); 
                    
                  }
                  var r =  {
                     tableTitles: tableTitles,
                     tableIds: tableIds,//[]ss
                     tableColumnHeadersLabels: tableColumnHeadersLabels, //[]
                     tableRowHeaders: tableRowHeaders,
                     datavalues: dataTableValues //[][] - array
                     
                  };
                deferred.resolve(r);
            });//ElementService.getElements - dataValuesMmEid
          });//ElementService.getElements - rowHeadersMmsEid
        } //end of function


      }); //end of ElementService
      return deferred.promise;
    }; //end of getTables

    var readTable = function(reqOb, ws, version) {
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
        readTables: readTables,
        toValidId: toValidId,
        readTableCols: readTableCols,
        readTable: readTable
    };

}
