import * as angular from "angular";
import Rx from 'rx';
import {RootScopeService} from "../../ve-utils/services/RootScope.service";
import {ViewApi, ViewService} from "../../ve-utils/services/View.service";
import {AuthService} from "../../ve-utils/services/Authorization.service";
import {Utils} from "../utilities/Utils.service";
import {ElementService} from "../../ve-utils/services/Element.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {handleChange, onChangesCallback} from "../../ve-utils/utils/change.util";
import {ElementObject, ElementsRequest} from "../../ve-utils/types/mms";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {veCore} from "../ve-core.module";

/**
 * @ngdoc directive
 * @name veCore.directive:mmsView
 *
 * @requires ViewService
 * @requires ElementService
 * @requires $element
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * Given a view id, renders the view according to the json given by veUtils/ViewService
 * The view has a text edit mode, where transclusions can be clicked. The view's last
 * modified time and author is the latest of any transcluded element modified time.
 * For available api methods, see methods section.
 *
 * ## Example
 * ### controller (js)
 *  <pre>
    angular.module('app', ['veCore'])
    .controller('ViewCtrl', ['this', function(this) {
        this.api = {}; //empty object to be populated by the view directive
       public handler(elementId) {
            //element with elementId clicked in view
        };
       public showComments() {
            this.api.setShowComments(true);
        };
    }]);
    </pre>
 * ### template (html)
 *  <pre>
    <div ng-controller="ViewCtrl">
        <button ng-click="showComments()">Show Comments</button>
        <view mms-element-id="view_element_id" mms-project-id="view_project_id" mms-cf-clicked="handler(elementId)" mms-view-api="api"></mms-view>
    </div>
    </pre>
 * ## Example view at a certain commit
 *  <pre>
    <view mms-element-id="view_element_id" mms-project-id="view_project_id" mms-commit-id="COMMIT_ID_HASH"></mms-view>
    </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {expression=} mmsCfClicked The expression to handle transcluded elements in the
 *              view being clicked, this should be a function whose argument is 'elementId'
 */

export class ViewController implements angular.IComponentController {

    private presentationElemCleanUpFncs: {(): any}[] = [];
    private mmsElementId: string;
    private mmsProjectId: string;
    private mmsRefId: string;
    private mmsCommitId: string;
    private mmsLink: boolean;
    private mmsViewApi: ViewApi;

    static $inject = [ '$element', 'growl', 'Utils', 'AuthService', 'ViewService', 'ElementService', 'EventService', 'RootScopeService']
    private showEdits: boolean;
    private modified: any;
    private modifier: object;
    private view: ElementObject;
    private reqOb: ElementsRequest = {elementId: '', projectId: '', refId: '', commitId: ''};
    private processed: boolean;
    private isHover: boolean;
    private isSection: boolean;
    private level: number;
    private showComments: boolean;
    private showElements: boolean;
    public subs: Rx.IDisposable[];


    constructor(private $element: angular.IRootElementService, private growl: angular.growl.IGrowlService, private utils: Utils, private authSvc: AuthService,
                private viewSvc: ViewService, private elementSvc: ElementService, private eventSvc: EventService,
                private rootScopeSvc: RootScopeService) {}

    $onInit() {
        this.eventSvc.$init(this);

        this.reqOb = {elementId: this.mmsElementId, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: this.mmsCommitId};
        this.processed = false;

        this.isSection = false;
        this.showElements = false;
        this.showComments = false;
        this.showEdits = false;

        this.subs.push(this.eventSvc.$on('show-comments', () => {
            this.toggleShowComments();
        }));

        this.subs.push(this.eventSvc.$on('show-elements', () => {
            this.toggleShowElements();
        }));

        this.subs.push(this.eventSvc.$on('show-edits', () => {
            if( (this.rootScopeSvc.veElementsOn() && this.rootScopeSvc.veEditMode()) || (!this.rootScopeSvc.veElementsOn() && !this.rootScopeSvc.veEditMode()) ){
                this.toggleShowElements();
            }
            this.toggleShowEdits();
        }));

        this._changeView(this.mmsElementId, '');

    }

    // $onChanges(onChangesObj:angular.IOnChangesObject) {
    //     handleChange(onChangesObj,'mmsElementId', this._changeView)
    // }

   public isTranscludedElement(elementName) {
        return elementName === 'MMS-TRANSCLUDE-COM' ||
            elementName === 'MMS-TRANSCLUDE-DOC' ||
            elementName === 'MMS-TRANSCLUDE-ART' ||
            elementName === 'MMS-TRANSCLUDE-IMG' ||
            elementName === 'MMS-TRANSCLUDE-NAME' ||
            elementName === 'MMS-TRANSCLUDE-VAL';

    };

   public isViewElement(elementName) {
        return elementName === 'MMS-VIEW-IMG' ||
            elementName === 'MMS-VIEW-LIST' ||
            elementName === 'MMS-VIEW-PARA' ||
            elementName === 'MMS-VIEW-TABLE' ||
            elementName === 'MMS-VIEW-TABLE-T' ||
            elementName === 'MMS-VIEW-LIST-T' ||
            elementName === 'MMS-VIEW-EQUATION';

    };

   public isPresentationElement(elementName) {
        return elementName === 'MMS-VIEW-PRESENTATION-ELEM';
    };

   public isEditable() {
        return this.showEdits;
    };

   public transcludeClicked(elementOb) {
        if (this.mmsViewApi && this.mmsViewApi.elementClicked && elementOb)
            this.mmsViewApi.elementClicked(elementOb);
    };

   public elementTranscluded(elem, type) {
        if (elem) {
            if (elem._modified > this.modified && type !== 'Comment') {
                this.modified = elem._modified;
                if (elem._modifier) {
                    this.authSvc.getUserData(elem._modifier).then((modifierData) =>{
                            this.modifier = modifierData.users[0];
                    }, () => {
                        this.modifier = elem._modifier;
                    });
                }
            }
            if (this.mmsViewApi && this.mmsViewApi.elementTranscluded)
                this.mmsViewApi.elementTranscluded(elem, type);
        }
    };

    //INFO this was getWsAndVersion
   public getElementOrigin() {
        return {
            projectId: this.mmsProjectId,
            refId: this.mmsRefId,
            commitId: this.mmsCommitId
        };
    };

   public getView() {
        // this view gets set in the viewlink fnc
        return this.view;
    };

   public hoverIn() {
        this.isHover = true;
    };
   public hoverOut() {
        this.isHover = false;
    };

   public setPeLineVisibility($event) {
        window.setTimeout(() => {
            var peContainer = $($event.currentTarget).closest('.add-pe-button-container');
            if (peContainer.find('.dropdown-menu').css('display') == 'none') {
                peContainer.find('hr').css('visibility', 'hidden');
            } else {
                peContainer.find('hr').css('visibility', 'visible');
            }
        });
    };

    private _changeView: onChangesCallback = (newVal, oldVal) => {
        if (!newVal || (newVal === oldVal && this.processed))
            return;

        this.processed = true;
        this.$element.addClass('isLoading');
        this.reqOb.elementId = this.mmsElementId;
        this.elementSvc.getElement(this.reqOb, 1)
        .then((data) => {
            //view accepts a section element
            if (data.type === 'InstanceSpecification') {
                this.isSection = true;
            }
            var operand = [];
            if (data._contents && data._contents.operand) {
                operand = data._contents.operand;
            }
            if (data.specification && data.specification.operand) {
                operand = data.specification.operand;
            }
            var dups = this.utils.checkForDuplicateInstances(operand);
            if (dups.length > 0) {
                this.growl.warning("There are duplicates in this view, dupilcates ignored!");
            }
            if (data._veNumber) {
                this.level = data._veNumber.split('.').length;
            }
            if (//data._numElements && data._numElements > 5000 &&
                    this.mmsCommitId && this.mmsCommitId !== 'latest') {
                //threshold where getting view elements in bulk takes too long and it's not latest
                //getting cached individual elements should be faster
                this.view = data;
                this.modified = data._modified;
                this.authSvc.getUserData(data._modifier).then((modifierData) =>{
                    this.modifier = modifierData.users[0];
                }, () => {
                    this.modifier = data._modifier;
                });
                return;
            }
            this.viewSvc.getViewElements(this.reqOb, 1)
            .finally(() => {
                this.view = data;
                this.modified = data._modified;
                this.authSvc.getUserData(data._modifier).then((modifierData) =>{
                    this.modifier = modifierData.users[0];
                }, () => {
                    this.modifier = data._modifier;
                });
                this.$element.removeClass('isLoading');
            });
        }, (reason) => {
            this.growl.error('Getting View Error: ' + reason.message + ': ' + this.mmsElementId);
        }).finally(() => {
            if (this.view)
                this.$element.removeClass('isLoading');
        });
    };



    /**
     * @ngdoc function
     * @name veCore.directive:mmsView#toggleShowElements
     * @methodOf veCore.directive:mmsView
     *
     * @description
     * toggle elements highlighting
     */
   public toggleShowElements() {
        this.showElements = !this.showElements;
        this.$element.toggleClass('outline');
    };

    /**
     * @ngdoc function
     * @name veCore.directive:mmsView#toggleShowComments
     * @methodOf veCore.directive:mmsView
     *
     * @description
     * toggle comments visibility
     */
   public toggleShowComments(value?: boolean) {
        this.showComments = !this.showComments;
        this.$element.toggleClass('reviewing');
    };

    /**
     * @ngdoc function
     * @name veCore.directive:mmsView#toggleShowEdits
     * @methodOf veCore.directive:mmsView
     *
     * @description
     * toggle elements editing panel
     */
   public toggleShowEdits(value?: boolean) {
        this.showEdits = !this.showEdits;
        this.$element.toggleClass('editing');
        // Call the callback functions to clean up frames, show edits, and
        // re-open frames when needed:
        for (var i = 0; i < this.presentationElemCleanUpFncs.length; i++) {
            this.presentationElemCleanUpFncs[i]();
        }
    };


}

let ViewComponent: VeComponentOptions = {
    selector: 'view',
    template: `
    <div id="{{$ctrl.mmsElementId}}" ng-class="{landscape: $ctrl.view._printLandscape}">

    <h1 ng-if="$ctrl.mmsLink" class="view-title">
      <span class="ve-view-number">{{$ctrl.view._veNumber}}</span> <view-link ng-class="{'docTitle-underlined': isHover}" mms-element-id="{{$ctrl.view.id}}" mms-doc-id="{{$ctrl.view.id}}"></view-link>
      <view-link class="open-document" ng-mouseover="hoverIn()" ng-mouseleave="hoverOut()" mms-element-id="{{$ctrl.view.id}}" mms-doc-id="{{$ctrl.view.id}}" 
        link-text="Open Document" link-class="btn btn-primary no-print" mms-external-link="true" link-icon-class="fa fa-share"></view-link>
    </h1>

    <h1 ng-if="!$ctrl.mmsLink" class="view-title h{{level}}">
        <span class="ve-view-number">{{$ctrl.view._veNumber}}</span> <mms-transclude-name mms-element-id="{{$ctrl.view.id}}" mms-project-id="{{$ctrl.view._projectId}}" mms-ref-id="{{$ctrl.view._refId}}"></mms-transclude-name>
    </h1>

    <div class="ve-secondary-text last-modified no-print">
      Last Modified: {{$ctrl.modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email !== undefined">{{ $ctrl.modifier.email }}</b><b ng-if="$ctrl.modifier.email == undefined">{{ $ctrl.modifier }}</b>
    </div>

    <i ng-hide="$ctrl.view" class="fa fa-2x fa-spinner fa-spin"></i>

    <add-pe-menu mms-view="$ctrl.view" index="-1" class="add-pe-button-container no-print"></add-pe-menu>
   
    <div ng-if="$ctrl.view._contents">
        <!-- Cant use track by instanceVal.instance b/c of possible duplicate entries -->
        <div ng-repeat="instanceVal in $ctrl.view._contents.operand track by instanceVal.instanceId"> 
            <view-pe mms-instance-val="::instanceVal"></view-pe>
            <add-pe-menu mms-view="$ctrl.view" index="$index" class="add-pe-button-container no-print"></add-pe-menu>
        </div>
    </div>
    <div ng-if="$ctrl.view.specification">
        <!-- Cant use track by instanceVal.instance b/c of possible duplicate entries -->
        <div ng-repeat="instanceVal in $ctrl.view.specification.operand track by instanceVal.instanceId"> 
            <view-pe mms-instance-val="::$ctrl.instanceVal"></view-pe>
            <add-pe-menu mms-view="$ctrl.view" index="$index" class="add-pe-button-container no-print"></add-pe-menu>
        </div>
    </div>
</div>
`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsLink: '<',
        mmsViewApi: '<'
    },
    controller: ViewController
}

veCore.component(ViewComponent.selector,ViewComponent)