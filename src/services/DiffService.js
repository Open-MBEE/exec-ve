'use strict';

angular.module('mms')
.factory('DiffService', ['$rootScope', DiffService]);

function DiffService($rootScope) {
  return {
    diff: function(workspace1, workspace2) {
      if (($rootScope.workspaces === null) || ($rootScope.workspaces === undefined)) {
        $rootScope.workspaces = JSON.parse('{"workspace1":{"elements":[{"documentation":"Lorem ipsum dolor set amit.","sysmlid":"_123_394241_12","name":"","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}},{"documentation":"Bacon ipsum pork set amit.","sysmlid":"_456_93419_14","name":"Burger","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}},{"documentation":"Foobar baz foo spam.","sysmlid":"_789_18919_19","name":"Pad Thai","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}},{"documentation":"Foobar baz foo spam.","sysmlid":"Lunch","name":"Lunch","owner":"Meals","specialization":{"type":"Element"}},{"documentation":"Foobar baz foo spam.","sysmlid":"Dinner","name":"Dinner","owner":"Meals","specialization":{"type":"Element"}},{"documentation":"Foobar baz foo spam.","sysmlid":"Meals","name":"Meals","owner":"null","specialization":{"type":"Package"}}],"graph":[{"sysmlid":"Meals","edges":["Lunch","Dinner"]},{"sysmlid":"Lunch","edges":["_123_394241_12","_456_93419_14","_789_18919_19"]},{"sysmlid":"Dinner","edges":[]}]},"workspace2":{"updatedElements":[{"sysmlid":"_123_394241_12","name":"Skewer"}],"addedElements":[{"documentation":"Salad ipsum dolor set amit.","sysmlid":"_192_19342_22","name":"Salad","owner":"Lunch","specialization":{"type":"Property","isDerived":"false","value":[{"type":"LiteralString","string":"binada_string"}]}}],"deletedElements":[{"sysmlid":"_456_93419_14"}],"movedElements":[{"sysmlid":"_789_18919_19","owner":"Dinner"}],"conflicts":[]}}');
      }
      return $rootScope.workspaces;
    }
  };
}