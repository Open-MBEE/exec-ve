'use strict';

angular.module('mms')
.factory('URLService', [URLService]);

function URLService() {
    var root = "/alfresco/service/javawebscripts";

    var getRoot = function() {
        return root;
    };

    var setRoot = function(r) {
        root = r;
    };

    return {
        getRoot: getRoot,
        setRoot: setRoot
    };

}