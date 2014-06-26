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

    var cleanElement = function(elem) {
        if (elem.hasOwnProperty('specialization')) {
            if (elem.specialization.type === 'Property') {
                var spec = elem.specialization;
                if (!_.isArray(spec.value))
                    spec.value = [];
                spec.value.forEach(function(val) {
                    if (val.hasOwnProperty('specialization'))
                        delete val.specialization;
                });
            }
            if (elem.specialization.type === 'View') {
                //delete elem.specialization.displayedElements;
                //delete elem.specialization.allowedElements;
            }
        }
    };

    return {
        hasCircularReference: hasCircularReference,
        cleanElement: cleanElement
    };
}