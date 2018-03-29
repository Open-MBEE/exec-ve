'use strict';

/** Used for annotating an element that doesn't have any commit history at all or for an element that is deleted but has commit history **/
angular.module('mms.directives')
    .directive('mmsAnnotation', ['$templateCache', '$rootScope', 'ViewService', mmsAnnotation]);

function mmsAnnotation($templateCache, $rootScope, ViewService) {
    var template = $templateCache.get('mms/templates/mmsAnnotation.html');
    return {
        restrict: 'A',
        template: template,
        scope: {
            mmsReqOb: '<',
            mmsRecentElement: '<',
            mmsType: '<',
            mmsCfLabel: '<'
        },
        controller: ['$scope', mmsAnnotationCtrl],
        link: mmsAnnotationLink
    };

    function mmsAnnotationLink(scope, element, attrs) {
        element.on('click', function() {
            if(scope.mmsRecentElement) {
                $rootScope.$broadcast('elementSelected', scope.mmsRecentElement, scope.mmsRecentElement._commitId);
            }
        });

        scope.copyToClipboard = function($event) {
            $event.stopPropagation();
            var target = element.find('#toolTipContent');
            var range = window.document.createRange();
            range.selectNode(target[0]);
            window.getSelection().addRange(range);
            try {
                window.document.execCommand('copy');
            } catch(err) {}
            window.getSelection().removeAllRanges();
        };
    }

    function mmsAnnotationCtrl($scope) {
        var displayContent;
        if ($scope.mmsRecentElement) {
            displayContent = _getContentIfElementFound($scope.mmsType, $scope.mmsRecentElement);
        } else {
            displayContent = _getContentIfElementNotFound($scope.mmsType, $scope.mmsReqOb, $scope.mmsCfLabel);
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
                //toolTipContent = element.name + ' name not found';
                toolTipContent = 'Element not found. Displaying last found name as placeholder.';
                break;
            case AT.mmsTranscludeDoc:
                inlineContent = element.documentation;
                //toolTipContent = element.name + ' documentation not found';
                toolTipContent = 'Element not found. Displaying last found documentation as placeholder.';
                break;
            case AT.mmsTranscludeCom:
                inlineContent = element.documentation;
                //toolTipContent = element.name + ' comment not found';
                toolTipContent = 'Comment not found. Displaying last found content as a placeholder.';
                break;
            case AT.mmsViewLink:
                inlineContent = element.name;
                //toolTipContent = element.name + ' view not found';
                toolTipContent = 'Element not found. Displaying last found view name as placeholder.';
                break;
            case AT.mmsTranscludeVal:
                inlineContent = _getValueForTranscludeVal(element);
                //toolTipContent = element.name + ' value not found';
                toolTipContent = 'Element not found. Displaying last found value as placeholder.';
                break;
            case AT.mmsPresentationElement:
                inlineContent = element.documentation || '<span>(no text)</span>';
                //toolTipContent = classifierType + element.name + ' presentation element not found';
                toolTipContent = classifierType + ' not found. Displaying last found content as placeholder.';
                break;
        }

        return {
            inlineContent: inlineContent,
            toolTipContent: toolTipContent
        };
    }

    function _getContentIfElementNotFound(type, reqOb, cfLabel) {
        var AT = ViewService.AnnotationType;
        var inlineContent = '';
        var tooltipContent = reqOb.elementId;
        var label = cfLabel ? '(' + cfLabel + ')' : '';
        switch (type) {
            case AT.mmsTranscludeName:
                inlineContent = 'cf name' + label + ' does not exist';
                break;
            case AT.mmsTranscludeDoc:
                inlineContent = 'cf documentation' + label + ' does not exist';
                break;
            case AT.mmsTranscludeCom:
                inlineContent = 'cf com' + label + ' does not exist';
                break;
            case AT.mmsTranscludeVal:
                inlineContent = 'cf value' + label + ' does not exist';
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
                value = element.defaultValue.value;
            } else if(element.value) {
                value = element.value[0].value;
            }

        }
        if (element.type === 'Constraint' && element.specification) {
            value = element.specification.value;
        }
        return value;
    }
}
