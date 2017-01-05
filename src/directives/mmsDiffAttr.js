'use strict';

angular.module('mms.directives')
.directive('mmsDiffAttr', ['ElementService', 'ConfigService', 'URLService','$q', '$compile', '$rootScope', '$interval', mmsDiffAttr]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsDiffAttr
 *
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 *  Compares a element at two different times and generates a pretty diff. 
 * ## Example
 * 
 * <mms-diff-attr mms-eid="element-id" mms-attr="name/doc/val" mms-version-one="timestamp/latest/tag?" mms-version-two="timestamp/latest/tag?"></mms-diff-attr>
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersionOne  can be 'latest', timestamp or tag id, default is latest
 * @param {string=latest} mmsVersionTwo  can be 'latest', timestamp or tag id, default is latest
 */
function mmsDiffAttr(ElementService, ConfigService, URLService, $q, $compile, $rootScope, $interval) {

    var mmsDiffAttrLink = function(scope, element, attrs, mmsViewCtrl) {
        // TODO: error checking for missing elements -- util function for http error?? 
        var ws = scope.mmsWs;
        if (mmsViewCtrl) {
            var viewVersion = mmsViewCtrl.getWsAndVersion();
            if (!ws)
                ws = viewVersion.workspace;
        }
                
        // Check if input is a tag, timestamp or neither        
        var tagOrTimestamp = function(version){
            var deferred = $q.defer();
            if(!URLService.isTimestamp(version) && version !== 'latest'){
                ConfigService.getConfig(version, ws, false).then(function(data){
                        deferred.resolve(data.timestamp);
                }, function(reason) {
                    deferred.reject(null);
                });
            }else{
                deferred.resolve(version);
            }
            return deferred.promise;
        };
        
        // Get the text to compare for diff
        var getComparsionText = function(ts){
            var deferred = $q.defer();
            ElementService.getElement(scope.mmsEid, false, ws, ts).then(function(data){
                var htmlData = angular.element(findElemType(data));

                // inject workspace and timestamp - check for data-mms-* and mms-*
                htmlData.find("mms-transclude-doc").each(function() {
                    var transcludeElm = angular.element(this);
                    if ( !transcludeElm.attr('mms-ws') || !transcludeElm.attr('data-mms-ws') ) {
                        transcludeElm.attr("mms-ws", ws);
                    }
                    if ( !transcludeElm.attr('mms-version') || !transcludeElm.attr('data-mms-version') ) {
                        transcludeElm.attr("mms-version", ts);
                    }
                });
                htmlData.find("mms-transclude-name").each(function() {
                    var transcludeElm = angular.element(this);
                    if ( !transcludeElm.attr('mms-ws') || !transcludeElm.attr('data-mms-ws') ) {
                        transcludeElm.attr("mms-ws", ws);
                    }
                    if ( !transcludeElm.attr('mms-version') || !transcludeElm.attr('data-mms-version') ) {
                        transcludeElm.attr("mms-version", ts);
                    }
                });
                
                htmlData.find("mms-transclude-val").each(function() {
                    var transcludeElm = angular.element(this);
                    if ( !transcludeElm.attr('mms-ws') || !transcludeElm.attr('data-mms-ws') ) {
                        transcludeElm.attr("mms-ws", ws);
                    }
                    if ( !transcludeElm.attr('mms-version') || !transcludeElm.attr('data-mms-version') ) {
                        transcludeElm.attr("mms-version", ts);
                    }
                });

                $compile(htmlData)($rootScope.$new());
                deferred.resolve(htmlData);
            }, function(reason) {
                element.html('<span class="mms-error">'+reason.message+'</span>');
                deferred.reject(null);
            });
            return deferred.promise;
        };
        
        // Find the right key to fetch text
        var findElemType = function(elem){
            if(scope.mmsAttr === 'name'){//the key is included and blank
                return elem.name + '';
            }else if (scope.mmsAttr === 'doc') {
                return elem.documentation + '';
            }else{
                if (!elem.specialization || !elem.specialization.value || !elem.specialization.value[0])
                    return '';
                if(elem.specialization.value[0].type === "LiteralString"){
                    return elem.specialization.value[0].string + '';
                }else if(elem.specialization.value[0].type === "LiteralReal"){
                    return elem.specialization.value[0].double + '';
                }else if(elem.specialization.value[0].type === "LiteralBoolean"){
                    return elem.specialization.value[0].boolean + '' ;
                } else if (elem.specialization.value[0].type === 'LiteralInteger') {
                    return elem.specialization.value[0].integer + '';
                }else{
                    element.html('<span class="mms-error">Value type not supported for now</span>');
                    return null;
                }
                
            }            
        };
        // example http://localhost:9000/mms.html#/workspaces/master/sites/vetest/documents/_17_0_5_1_407019f_1402422683509_36078_16169/views/_17_0_5_1_407019f_1402422692412_131628_16263
        var versionOne;
        var versionTwo;
        // scope.htmlv1 = null;
        // scope.htmlv2 = null;

        // scope.$watch('htmlv1', function() {
        //     scope.origElem = angular.element(scope.htmlv1).text();
        // });
        // scope.$watch('htmlv2', function() {
        //     scope.compElem = angular.element(scope.htmlv2).text();
        // });
        tagOrTimestamp(scope.mmsVersionOne).then(function(versionOrTs){
            getComparsionText(versionOrTs).then(function(data){
                scope.origElem = angular.element(data).text();
                // run on interval to check when data gets changed. once it changes set to origElem and break out of interval
                 $interval(
                    function(){
                        scope.origElem = angular.element(data).text();
                        console.log("here is the changed text: " +scope.origElem);
                    }, 5000);
            }, function(reject){
                scope.origElem = reject;
            });
        }, function(reject){
            element.html('<span class="mms-error">Version one not a valid tag or timestamp</span>');
        });
        tagOrTimestamp(scope.mmsVersionTwo).then(function(versionOrTs){
            getComparsionText(versionOrTs).then(function(data){
                scope.compElem = angular.element(data).text();
                $interval(
                    function(){
                        scope.compElem = angular.element(data).text();
                    }, 5000);
            }, function(reject){
                scope.compElem = reject;
            });
        }, function(reject){
            element.html('<span class="mms-error">Version two not a valid tag or timestamp</span>');
        });
    };

    return {
        restrict: 'E',
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsAttr: '@',
            mmsVersionOne: '@',
            mmsVersionTwo: '@'
        },
        template: '<style>del{color: black;background: #ffbbbb;} ins{color: black;background: #bbffbb;}</style><div semantic-diff left-obj="origElem" right-obj="compElem"></div>',
        require: '?^^mmsView',
        link: mmsDiffAttrLink
    };
}