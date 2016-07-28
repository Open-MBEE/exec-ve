'use strict';

angular.module('mms.directives')
.directive('mmsDiffAttr', ['ElementService', mmsDiffAttr]);

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
 *  <pre>
    <mms-diff-attr mms-eid="element-id" mms-attr="name/doc/val" mms-version1="timestamp/latest/tag?" mms-version2="timestamp/latest/tag?"></mms-diff-attr>
    </pre>
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsDiffAttr(ElementService) {

    var mmsDiffAttrLink = function(scope, element, attrs, controllers) {
        // after complation dom and event handlers
        
        //call element at v1 and v2, if v2 empty look at viewController to see inherited timestamp if empty use latest
        // get WS from mmsview
        var origElem;
        var compElem;
        // TODO: error checking for missing elements -- util function for http error?? 
        console.log("This is the workspace" + scope.mmsWs);
        console.log("This is the version" + scope.mmsVersionOne);
        ElementService.getElement(scope.mmsEid, false, scope.mmsWs, scope.mmsVersionOne).then(function(data){
            console.log(data);
            scope.origElem = findElemType(data);
        });
        ElementService.getElement(scope.mmsEid, false, scope.mmsWs, scope.mmsVersionTwo).then(function(data){
            console.log(data);
            scope.compElem = findElemType(data); 
        });
        var findElemType = function(elem){
            if(scope.mmsAttr === 'name'){//the key is included and blank
                return elem.name;
            }else if (scope.mmsAttr === 'doc') {
                return elem.documentation;
            }else{
                if(elem.specialization.value[0].type === "LiteralString"){
                    return elem.specialization.value[0].string;
                }else if(elem.specialization.value[0].type === "LiteralReal"){
                    return elem.specialization.value[0].double;
                }else if(elem.specialization.value[0].type === "LiteralBoolean"){
                    return elem.specialization.value[0].integer;
                }else{
                    return 'Not Supported';
                }
                
            }            
        };

        // Two Jsons: keys are either name and documentaiton string depending on the attribute, then a separte case is value
        // if value, check for either string, integer, boolean as the key inside the array specialization => 'value':[]
        // example http://localhost:9000/mms.html#/workspaces/master/sites/vetest/documents/_17_0_5_1_407019f_1402422683509_36078_16169/views/_17_0_5_1_407019f_1402422692412_131628_16263
        
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
        template: '<style>del{color: black;background: #ffbbbb;} ins{color: black;background: #bbffbb;}</style><pre semantic-diff left-obj="origElem" right-obj="compElem"></pre>',
        require: '?^^mmsView',
        link: mmsDiffAttrLink
    };
}