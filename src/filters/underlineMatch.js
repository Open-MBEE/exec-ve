'use strict';

angular.module('mms').filter('underlineMatch', ['$filter', partialMatch]);
function partialMatch($filter) {
    var standardDateFilterFn = $filter('uibTypeaheadHighlight');
    return function(match, query) {
        var result = standardDateFilterFn(match, query);
        result = result.replace('<strong>', '<u>').replace('</strong>', '</u>');
        return result;
    }
}
