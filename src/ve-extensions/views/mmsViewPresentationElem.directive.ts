import * as angular from "angular";
import {ViewService} from "../../ve-utils/services/ViewService.service";
import {ElementService} from "../../ve-utils/services/ElementService.service";
var veExt = angular.module('veExt');

/**
 * @ngdoc component
 * @name veDirectives.component:mmsViewPresentationElem
 *
 * @requires mms.ViewService
 * @requires mms.ElementService
 * @requires $templateCache
 * @requires $location
 * @requires $timeout
 * @requires $rootScope
 * @requires $anchorScroll
 * @requires growl
 *
 *
 * @restrict E
 *
 * @description
 * Given a InstanceVal, parses the element reference tree to get the corresponding
 * presentation element, and renders it in the view
 * 
 * @param {Object} mmsInstanceVal A InstanceValue json object 
 * @param {Object} mmsParentSection the parent section if available
 */
let ViewPresentationElemComponent: angular.ve.ComponentOptions = {
    selector: 'viewPresentationElem',
    template: `
    <div ng-if="$ctrl.presentationElemLoading" class="fa fa-spinner fa-spin"></div>  
`,
    require: {
        viewCtrl: '?^^view'
    },
    bindings: {
        mmsInstanceVal: '<',
        mmsParentSection: '<'
    },
    controller: class ViewPresentationElemController implements angular.IComponentController {

        private mmsInstanceVal
        private mmsParentSection
        
        private viewCtrl

        public presentationElemLoading
        public instanceSpec
        public presentationElem

        static $inject = ['$scope', '$element', '$timeout', '$location', '$anchorScroll', '$compile', 'ViewService',
            'ElementService']
        constructor(private $scope: angular.IScope, private $element: angular.IRootElementService,
                    private $timeout: angular.ITimeoutService, private $location: angular.ILocationService,
                    private $anchorScroll: angular.IAnchorScrollService, private $compile: angular.ICompileService,
                    private viewSvc: ViewService, private elementSvc: ElementService) {}

        $onInit() {
            this.presentationElemLoading = true;

            if (this.mmsInstanceVal) {
                if (!this.mmsInstanceVal.instanceId) {
                    this.$element.html('<span class="mms-error">Reference is null</span>');
                    return;
                }
                var projectId = null;
                var refId = null;
                var commitId = null;
                if (this.viewCtrl) {
                    var viewVersion = this.viewCtrl.getElementOrigin();
                    projectId = viewVersion.projectId;
                    refId = viewVersion.refId;
                    commitId = viewVersion.commitId;
                }
                // Parse the element reference tree for the presentation element:
                this.$element.addClass("isLoading");
                var reqOb = {elementId: this.mmsInstanceVal.instanceId, projectId: projectId, refId: refId, commitId: commitId, includeRecentVersionElement: true};
                this.elementSvc.getElement(reqOb, 1)
                    .then((instanceSpec) => {
                        this.presentationElem = this.viewSvc.getPresentationElementSpec(instanceSpec);
                        this.instanceSpec = instanceSpec;
                        this.presentationElemLoading = false;
                        var hash = this.$location.hash();
                        if (hash === instanceSpec.id) {
                            this.$timeout(() => {
                                this.$anchorScroll();
                            }, 1000, false);
                        }
                        if (this.viewCtrl) {
                            this.viewCtrl.elementTranscluded(instanceSpec);
                        }
                        this.$element.on('click', ((e) => {
                            if (this.viewCtrl)
                                this.viewCtrl.transcludeClicked(instanceSpec);
                            e.stopPropagation();
                        }));
                    }, (reason) => {
                        if (reason.status === 500) {
                            this.$element.html('<span class="mms-error">View element reference error: ' + this.mmsInstanceVal.instanceId + ' invalid specification</span>');
                        } else {
                            this.$element.html('<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type"></annotation>');
                            this.$compile(this.$element.contents())(Object.assign(this.$scope.$new(), {
                                reqOb: reqOb,
                                recentElement: reason.data.recentVersionOfElement,
                                type: this.viewSvc.AnnotationType.mmsPresentationElement
                            }));
                        }
                    }).finally(() => {
                    this.$element.removeClass("isLoading");
                });
            }
        }

        public getInstanceSpec = () =>{
            return this.instanceSpec;
        };

        public getInstanceVal = () =>{
            return this.mmsInstanceVal;
        };

        public getPresentationElement = () =>{
            return this.presentationElem;
        };

        public getParentSection = () =>{
            return this.mmsParentSection;
        };

    }
}

veExt.component