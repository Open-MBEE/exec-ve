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

    var getSnapshotURL = function(id) {

    };

    var getTagURL = function(id) {

    };

    var getImageURL = function(id) {

    };

    var getSiteDashboardURL = function(site) {

    };

    var getSiteDocWebURL = function(site) {

    };

    var getSiteViewEditorURL = function(site) {

    };

    var getElementURL = function(id) {

    };

    var getPostElementsURL = function() {

    };

    var getViewURL = function(id) {

    };

    return {
        getRoot: getRoot,
        setRoot: setRoot
    };

}