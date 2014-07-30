'use strict';

angular.module('mms.directives.diff', ['mms', 'mms.directives']);

angular.module('mms.directives.diff')
.factory('DiffService', [DiffService]);

function DiffService() {
  return {
    tableElement: null,
    workspaces: null,
    diff: function(workspace1, workspace2) {
      if (this.workspaces === null) {
        this.workspaces = JSON.parse('{"workspace1":{"elements":[{"documentation":"Lorem ipsum dolor set amit.","sysmlid":"_123_394241_12","name":"","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}},{"documentation":"Bacon ipsum pork set amit.","sysmlid":"_456_93419_14","name":"Burger","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}},{"documentation":"Foobar baz foo spam.","sysmlid":"_789_18919_19","name":"Pad Thai","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}}]},"workspace2":{"updatedElements":[{"sysmlid":"_123_394241_12","name":"Skewer"}],"deletedElements":[],"addedElements":[{"documentation":"Salad ipsum dolor set amit.","sysmlid":"_192_19342_22","name":"Salad","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}}],"movedElements":[{"sysmlid":"_789_18919_19","owner":"Dinner"}],"conflicts":[{"documentation":"Sausage ipsum pork set amit.","sysmlid":"_456_93419_14"}]}    }');
      }
      return this.workspaces;
    },
    loadTableWithElement: function(element) {
      if (this.workspaces !== null) {
        var originalElements = this.workspaces.workspace1.elements;
        this.tableElement = originalElements.filter(function(entry) {
            return entry && entry.name.indexOf(element) !== -1;
          })[0];
      }
    }
  };
}