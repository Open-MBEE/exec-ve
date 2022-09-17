import * as angular from "angular";
import {ElementService, ViewService} from "@ve-utils/mms-api-client";
import {EventService, TreeApi, TreeService} from "@ve-utils/core-services";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ExtensionService, veExt} from "@ve-ext";
import Rx from "rx-lite";
import {ViewController} from "@ve-ext/presentations/view.component";
import {ElementObject, PresentationInstanceObject} from "@ve-types/mms";

/**
 * @ngdoc component
 * @name veExt.component:mmsViewPresentationElem
 *
 * @requires veUtils/ViewService
 * @requires veUtils/ElementService
 * @requires $templateCache
 * @requires $location
 * @requires $timeout
 * @requires $rootScope
 * @requires $anchorScroll
 * @requires growl
 *
 *
 *
 * @description
 * Given a InstanceVal, parses the element reference tree to get the corresponding
 * presentation element, and renders it in the view
 *
 * @param {Object} mmsInstanceVal A InstanceValue json object
 * @param {Object} mmsParentSection the parent section if available
 */
export class ViewPresentationElemController implements angular.IComponentController {

    private mmsInstanceVal
    private mmsParentSection

    private viewCtrl: ViewController

    public subs: Rx.IDisposable[];
    private treeApi: TreeApi

    public presentationElemLoading
    public instanceSpec
    public presentationElem: PresentationInstanceObject | ElementObject
    public peNumber: string;

    static $inject = ['$scope', '$element', '$timeout', '$location', '$anchorScroll', '$compile', 'ViewService',
        'ElementService', 'TreeService', 'ExtensionService', 'EventService']
    constructor(private $scope: angular.IScope, private $element: JQuery<HTMLElement>,
                private $timeout: angular.ITimeoutService, private $location: angular.ILocationService,
                private $anchorScroll: angular.IAnchorScrollService, private $compile: angular.ICompileService,
                private viewSvc: ViewService, private elementSvc: ElementService, private treeSvc: TreeService,
                private extensionSvc: ExtensionService, private eventSvc: EventService) {}

    $onInit() {
        this.presentationElemLoading = true;
        this.treeApi = this.treeSvc.getApi();
        this.eventSvc.$init(this);

        //Init PeNumber
        if (this.treeApi.branch2viewNumber[this.instanceSpec.id]) {
            this.peNumber = this.treeApi.branch2viewNumber[this.instanceSpec.id];
        }
        this.subs.push(this.eventSvc.$on(TreeService.events.UPDATED, () => {
            if (this.treeApi.branch2viewNumber[this.instanceSpec.id]) {
                this.peNumber = this.treeApi.branch2viewNumber[this.instanceSpec.id];
            }
        }));

        if (!this.mmsInstanceVal || !this.mmsInstanceVal.instanceId) {
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
                this.presentationElem = this.viewSvc.getPresentationInstanceObject(instanceSpec);
                this.instanceSpec = instanceSpec;
                this.presentationElemLoading = false;
                var hash = this.$location.hash();
                if (hash === instanceSpec.id) {
                    this.$timeout(() => {
                        this.$anchorScroll();
                    }, 1000, false);
                }
                if (this.viewCtrl) {
                    this.viewCtrl.elementTranscluded(instanceSpec, this.presentationElem.type);
                }
                this.$element.on('click', ((e) => {
                    if (this.viewCtrl)
                        this.viewCtrl.transcludeClicked(instanceSpec);
                    e.stopPropagation();
                }));
                let tag = this.extensionSvc.getTagByType("present", this.presentationElem.type);

                let newPe = $('<div id="' + this.instanceSpec.id + '" ng-if="!$ctrl.presentationElemLoading"></div>')
                $(newPe).append('<' + tag + ' pe-object="::$ctrl.presentationElem" element="::$ctrl.instanceSpec" pe-number="$ctrl.peNumber">' + '</' + tag + '>');
                $(this.$element).append(newPe);
                this.$compile(newPe)(this.$scope);
            }, (reason) => {
                if (reason.status === 500) {
                    this.$element.html('<span class="mms-error">View element reference error: ' + this.mmsInstanceVal.instanceId + ' invalid specification</span>');
                } else {
                    this.$element.html('<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type"></annotation>');
                    this.$compile($(this.$element))(Object.assign(this.$scope.$new(), {
                        reqOb: reqOb,
                        recentElement: reason.data.recentVersionOfElement,
                        type: this.extensionSvc.AnnotationType.mmsPresentationElement
                    }));
                }
            }).finally(() => {
            this.$element.removeClass("isLoading");
        });
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

let ViewPeComponent: VeComponentOptions = {
    selector: 'viewPe',
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
    controller: ViewPresentationElemController
}

veExt.component(ViewPeComponent.selector,ViewPeComponent);
