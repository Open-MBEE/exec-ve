'use strict';

angular.module('mms.directives')
.directive('mmsDiffAttr', ['ElementService', 'ConfigService', 'URLService','$q', mmsDiffAttr]);

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
 * <mms-diff-attr mms-eid="element-id" mms-attr="name/doc/val" mms-version1="timestamp/latest/tag?" mms-version2="timestamp/latest/tag?"></mms-diff-attr>
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersionOne  can be 'latest', timestamp or tag id, default is latest
 * @param {string=latest} mmsVersionTwo  can be 'latest', timestamp or tag id, default is latest
 */
function mmsDiffAttr(ElementService, ConfigService, URLService, $q) {

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
        var getComparsionText = function(version){
            var deferred = $q.defer();
            ElementService.getElement(scope.mmsEid, false, ws, version).then(function(data){
                deferred.resolve(findElemType(data));
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
        tagOrTimestamp(scope.mmsVersionOne).then(function(data){
            versionOne = data;
            getComparsionText(versionOne).then(function(data){
                scope.origElem = data;
            }, function(reject){
                scope.origElem = reject;
            });
        }, function(reject){
            element.html('<span class="mms-error">Version one not a valid tag or timestamp</span>');
        });
        tagOrTimestamp(scope.mmsVersionTwo).then(function(data){
            versionTwo = data;
            getComparsionText(versionTwo).then(function(data){
                scope.compElem = data;
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