'use strict';

angular.module('mms')
.factory('DiffService', ['$rootScope', DiffService]);

function DiffService($rootScope) {
  return {
    diff: function(workspace1, workspace2) {
      if (($rootScope.workspaces === null) || ($rootScope.workspaces === undefined)) {
        $rootScope.workspaces = JSON.parse('{"workspace1":{"elements":[{"documentation":"Lorem ipsum dolor set amit.","sysmlid":"_123_394241_12","name":"","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}},{"documentation":"Bacon ipsum pork set amit.","sysmlid":"_456_93419_14","name":"Burger","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}},{"documentation":"Foobar baz foo spam.","sysmlid":"_789_18919_19","name":"Pad Thai","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}}]},"workspace2":{"updatedElements":[{"sysmlid":"_123_394241_12","name":"Skewer"}],"deletedElements":[],"addedElements":[{"documentation":"Salad ipsum dolor set amit.","sysmlid":"_192_19342_22","name":"Salad","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}}],"movedElements":[{"sysmlid":"_789_18919_19","owner":"Dinner"}],"conflicts":[{"documentation":"Sausage ipsum pork set amit.","sysmlid":"_456_93419_14"}]}    }');
      }
      return $rootScope.workspaces;
    },
    loadTableWithElement: function(element) {
      if ($rootScope.workspaces !== null) {
        var originalElements = $rootScope.workspaces.workspace1.elements;
        var conflicts = $rootScope.workspaces.workspace2.conflicts;
        var movedElements = $rootScope.workspaces.workspace2.movedElements;
        var updatedElements = $rootScope.workspaces.workspace2.updatedElements;
        var addedElements = $rootScope.workspaces.workspace2.addedElements;

        $rootScope.tableElement = originalElements.filter(function(entry) {
            return entry && entry.name.indexOf(element) !== -1;
          })[0];

        for(var i=0; i < conflicts.length; i++) {
          if(conflicts[i].sysmlid === $rootScope.tableElement.sysmlid){
             $rootScope.conflictElement = conflicts[i];
             $rootScope.mergeConflict = true;
          } else {
            $rootScope.conflictElement = null;
            $rootScope.mergeConflict = false;
          }
        }

        for(var j=0; j < movedElements.length; j++) {
          if(movedElements[j].sysmlid === $rootScope.tableElement.sysmlid) {
            $rootScope.movedElement = movedElements[j];
            $rootScope.elementMoved = true;
          } else {
            $rootScope.movedElement = null;
            $rootScope.elementMoved = false;
          }

          for(var k=0; k < updatedElements.length; k++) {
            if(updatedElements[k].sysmlid === $rootScope.tableElement.sysmlid) {
              $rootScope.updatedElement = updatedElements[k];
              $rootScope.elementUpdated = true;
            } else {
              $rootScope.updatedElement = null;
              $rootScope.elementUpdated = false;
            }
          }

          for(var m=0; m < addedElements.length; m++){
            if(addedElements[m].sysmlid === $rootScope.tableElement.sysmlid) {
              $rootScope.addedElement = addedElements[m];
              $rootScope.elementAdded = true;
            } else {
              $rootScope.addedElement = null;
              $rootScope.elementAdded = false;
            }
          }
        }
      }
    }
  };
}