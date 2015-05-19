'use strict';

angular.module('mms.directives')
.directive('mmsViewSectionStruct', ['$compile', '$templateCache', 'ViewService', mmsViewSectionStruct]);

function mmsViewSectionStruct($compile, $templateCache, ViewService) {
    var template = $templateCache.get('mms/templates/mmsViewSectionStruct.html');

    var mmsViewSectionStructLink = function(scope, element, attrs, mmsViewStructCtrl) {

        var compile = function() {
            element.append(template);
            $compile(element.contents())(scope);             
        };

        if (scope.section.instance) {
            scope.presentationElement = undefined;
            scope.instanceSpecificationSpecification = undefined;

            ViewService.parseExprRefTree(scope.section, scope.mmsWs).then(function(presentationElement) {

                scope.presentationElement = presentationElement;
                scope.instanceSpecificationSpecification = presentationElement.specialization.instanceSpecificationSpecification;

                scope.instance2presentation = {};
                scope.instance2specification = {};
                
                angular.forEach(scope.instanceSpecificationSpecification.operand, function(content) {

                    ViewService.parseExprRefTree(content, scope.mmsWs).then(function(presentationElement2) {

                        scope.instance2presentation[content.instance] = presentationElement2;

                    });

                    ViewService.getInstanceSpecification(content, scope.mmsWs).then(function(instanceSpecification2) {

                        scope.instance2specification[content.instance] = instanceSpecification2;

                    });
                });

                compile();

            });

        } else {
            compile();      
        }

        scope.editing = function() {
            if (mmsViewStructCtrl) {
                return mmsViewStructCtrl.getEditing();
            } else
                return false;
        };
    };

    return {
        restrict: 'E',
        scope: {
            section: '=mmsSection',
        },
        require: '?^mmsViewStruct',
        link: mmsViewSectionStructLink
    };
}