'use strict';

angular.module('mms.directives')
.directive('mmsSiteDocFilter', ['ElementService', 'ViewService', 'growl', '$templateCache', '$q', mmsSiteDocFilter]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsSiteDocFilter
 *
 * @requires mms.ElementService
 * @requires mms.ViewService
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsSite The site id of documents to filter
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsSiteDocFilter(ElementService, ViewService, growl, $templateCache, $q) {

    var mmsSiteDocFilterLink = function(scope, element, attrs) {
        scope.filtered = {};
        var editable = true;
        var orig = null;
        scope.siteDocs = [];
        scope.siteDocsFiltered = [];
        scope.editing = false;
        scope.saving = false;
        scope.ws = scope.mmsWs;
        scope.version = scope.mmsVersion;
        
        ElementService.getElement("master_filter", false, scope.mmsWs, scope.mmsVersion)
        .then(function(data) {
            orig = data;
            scope.filtered = JSON.parse(data.documentation);
            if (!data.editable)
                editable = false;
            ViewService.getSiteDocuments(scope.mmsSite, false, scope.mmsWs, scope.mmsVersion)
            .then(function(docs) {
                updateSiteDocs(docs);
                scope.cachedSiteDocs = docs;
                scope.$watchCollection("cachedSiteDocs", function(newVal, oldVal) {
                    if (newVal) {
                        updateSiteDocs(newVal);
                        //updateSiteDocsFiltered();
                    }
                });
                //updateSiteDocsFiltered();
            }, function(reason) {
                editable = false;
            });
        }, function(reason) {
            editable = false;
        });
        
        if (scope.mmsVersion && scope.mmsVersion !== 'latest')
            editable = false;

        var updateSiteDocs = function(cacheSiteDocs) {
            scope.siteDocs = [];
            cacheSiteDocs.forEach(function(doc) {
                scope.siteDocs.push({show: !scope.filtered[doc.sysmlid], doc: doc});
            });
        };

        var updateSiteDocsFiltered = function() {
            scope.siteDocsFiltered = [];
            scope.siteDocs.forEach(function(doc) {
                if (doc.show)
                    scope.siteDocsFiltered.push(doc.doc);
            });
        };

        var cancel = function() {
            if (orig) {
                scope.filtered = JSON.parse(orig.documentation);
                scope.siteDocs.forEach(function(doc) {
                    if (scope.filtered[doc.doc.sysmlid])
                        doc.show = false;
                    else
                        doc.show = true;
                });
                //updateSiteDocsFiltered();
            }
        };

        var save = function() {
            if (scope.saving) {
                growl.info("Saving, please wait");
                return;
            }
            scope.saving = true;
            var deferred = $q.defer();
            if (!editable || !scope.editing) {
                deferred.resolve("ok");
                return deferred.promise;
            }
            ElementService.updateElement({
                sysmlid: "master_filter", 
                documentation: JSON.stringify(scope.filtered)
            }, scope.mmsWs).then(function(data) {
                //updateSiteDocsFiltered();
                growl.success("Filter Saved");
                scope.saving = false;
                deferred.resolve(data);
                //scope.editing = false;
            }, function(reason) {
                deferred.reject({type: 'error', message: reason.message});
                scope.saving = false;
            });
            return deferred.promise;
        };

        var toggleCheck = function(id) {
            scope.filtered[id] = !scope.filtered[id];
        };

        scope.checkall = false;
        scope.toggleAll = function() {
            //scope.checkall = !scope.checkall;
            scope.siteDocs.forEach(function(sitedoc) {
                sitedoc.show = scope.checkall;
                scope.filtered[sitedoc.doc.sysmlid] = !scope.checkall;
            });
            //updateSiteDocsFiltered();
        };

        scope.toggleCheck = toggleCheck;
        scope.save = save;
        scope.cancel = cancel;

        if (scope.mmsApi) {
            scope.mmsApi.save = save;
            scope.mmsApi.cancel = cancel;
            scope.mmsApi.setEditing = function(mode) {
                if (editable && mode)
                    scope.editing = true;
                else
                    scope.editing = false;
            };
            scope.mmsApi.getEditing = function() {
                return scope.editing;
            };
        }
    };

    return {
        template: $templateCache.get('mms/templates/mmsSiteDocFilter.html'),
        restrict: 'E',
        scope: {
            mmsSite: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsApi: '='
        },
        link: mmsSiteDocFilterLink
    };
}