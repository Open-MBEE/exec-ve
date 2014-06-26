'use strict';

angular.module('mms')
.factory('UtilsService', ['_', UtilsService]);

/**
 * @ngdoc service
 * @name mms.UtilsService
 * @requires _
 * 
 * @description
 * Utilities
 */
function UtilsService(_) {
    
    var hasCircularReference = function(scope, curId, curType) {
        var curscope = scope;
        while (curscope.$parent) {
            var parent = curscope.$parent;
            if (parent.mmsEid === curId && parent.cfType === curType)
                return true;
            curscope = parent;
        }
        return false;
    };

    return {
        hasCircularReference: hasCircularReference
    };
}