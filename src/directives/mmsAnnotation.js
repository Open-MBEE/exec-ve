'use strict';

/** Used for annotating an element that doesn't have any commit history at all or for an element that is deleted but has commit history **/
angular.module('mms.directives')
    .directive('mmsAnnotation', ['$templateCache', 'ViewService', mmsAnnotation]);

function mmsAnnotation($templateCache, ViewService) {
    var template = $templateCache.get('mms/templates/mmsAnnotation.html');
    return {
        restrict: 'A',
        template: template,
        scope: {
            mmsReqOb: '<',
            mmsRecentElement: '<',
            mmsType: '<'
        },
        controller: ['$scope', mmsAnnotationCtrl],
        link: mmsAnnotationLink
    };

    function mmsAnnotationLink(scope, element, attrs) {}

    function mmsAnnotationCtrl($scope) {
        var displayContent;
        if ($scope.mmsRecentElement) {
            displayContent = _getContentIfElementFound($scope.mmsType, $scope.mmsRecentElement);
        } else {
            displayContent = _getCOntentIfElementNotFound($scope.mmsType, $scope.mmsReqOb);

        }
        $scope.displayContent = displayContent;
    }

    function _getContentIfElementFound(type, element) {
        var AT = ViewService.AnnotationType;
        var inlineContent = '';
        var toolTipContent;
        var classifierType = ViewService.getTypeFromClassifierId(element.classifierIds);

        switch (type) {
            case AT.mmsTranscludeName:
                inlineContent = element.name;
                toolTipContent = classifierType + element.name + ' name not found';
                break;
            case AT.mmsTranscludeDoc:
                inlineContent = element.documentation;
                toolTipContent = classifierType + element.name + ' documentation not found';
                break;
            case AT.mmsTranscludeCom:
                inlineContent = element.documentation;
                toolTipContent = element.name + ' comment not found';
                break;
            case AT.mmsViewLink:
                inlineContent = element.name;
                toolTipContent = element.name + ' view not found';
                break;
            case AT.mmsTranscludeVal:
                inlineContent = _getValueForTranscludeVal(element);
                toolTipContent = element.name + ' value not found';
                break;
            case AT.mmsPresentationElement:
                inlineContent = element.documentation;
                toolTipContent = element.name + ' presentation element not found';
                break;
        }

        return {
            inlineContent: inlineContent,
            toolTipContent: toolTipContent
        };
    }

    function _getCOntentIfElementNotFound(type, reqOb) {
        var AT = ViewService.AnnotationType;
        var inlineContent = '';
        var tooltipContent = reqOb.id;
        switch (type) {
            case AT.mmsTranscludeName:
                inlineContent = 'cf name does not exist';
                break;
            case AT.mmsTranscludeDoc:
                inlineContent = 'cf documentation does not exist';
                break;
            case AT.mmsTranscludeCom:
                inlineContent = 'cf com does not exist';
                break;
            case AT.mmsTranscludeVal:
                inlineContent = 'cf value does not exist';
                break;
            case AT.mmsViewLink:
                inlineContent = 'view link does not exist';
                break;
            case AT.mmsPresentationElement:
                inlineContent = 'presentation element does not exist';
                break;
        }

        return {
            inlineContent: inlineContent,
            toolTipContent: tooltipContent
        };
    }

    function _getValueForTranscludeVal(element) {
        var value = '';
        if (element.type === 'Property' || element.type === 'Port' ||element.type === 'Slot') {
            if (element.defaultValue) {
                value = element.defaultValue;
            } else if(element.valueOf) {
                value = element.value;
            }

        }
        if (element.type === 'Constraint' && element.specification) {
            value = element.specification;
        }
        return value;
    }
}