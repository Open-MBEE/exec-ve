import * as angular from "angular";
import Rx from 'rx-lite';

import {
    AuthService,
    ElementService,
    ViewApi,
    ViewService
} from "@ve-utils/mms-api-client"
import {
    EventService,
    RootScopeService
} from "@ve-utils/services";
import {CoreUtilsService} from "@ve-core/services";
import {handleChange, onChangesCallback} from "@ve-utils/utils";
import {ElementObject, ElementsRequest} from "@ve-types/mms";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ComponentService} from "@ve-components/services";
import {veComponents} from "@ve-components";
import {PresentationService} from "@ve-components/presentations/services/Presentation.service";
import {TreeApi, TreeService} from "@ve-core/tree";

/**
 * @ngdoc directive
 * @name veComponents.component:View
 *
 * @requires ViewService
 * @requires ElementService
 * @requires $element
 * @requires growl
 *
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
    angular.module('app', ['ve-components'])
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
 */

export class ViewController implements angular.IComponentController {

    // private presentationElemCleanUpFncs: {(): any}[] = [];
    private mmsElementId: string;
    private mmsProjectId: string;
    private mmsRefId: string;
    private mmsCommitId: string;
    private mmsLink: boolean;
    public mmsViewApi: ViewApi;
    private mmsNumber: number
    public noTitle: boolean;

    static $inject = [ '$element', 'growl', 'ComponentService', 'AuthService', 'PresentationService', 'ViewService',
        'ElementService', 'EventService', 'TreeService', 'RootScopeService']
    private showEdits: boolean;
    private modified: any;
    private modifier: object;
    private view: ElementObject;
    private reqOb: ElementsRequest = {elementId: '', projectId: '', refId: '', commitId: ''};
    private processed: boolean;
    private isHover: boolean;
    private isSection: boolean;
    private level: number;
    private number: string;
    private showComments: boolean;
    private showElements: boolean;
    public subs: Rx.IDisposable[];
    private treeApi: TreeApi



    constructor(private $element: JQuery<HTMLElement>, private growl: angular.growl.IGrowlService,
                private componentSvc: ComponentService,
                private authSvc: AuthService, private presentationSvc: PresentationService,
                private viewSvc: ViewService, private elementSvc: ElementService, private eventSvc: EventService,
                private treeSvc: TreeService, private rootScopeSvc: RootScopeService) {}

    $onInit() {
        this.eventSvc.$init(this);
        this.treeApi = this.treeSvc.getApi();

        this.reqOb = {elementId: this.mmsElementId, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: this.mmsCommitId};
        this.processed = false;

        this.number = (this.mmsNumber) ? this.mmsNumber.toString(10) : '';

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

        this.subs.push(this.eventSvc.$on(TreeService.events.UPDATED, () => {
            if (this.treeApi.branch2viewNumber[this.mmsElementId]) {
                this.level = this.treeApi.branch2viewNumber[this.mmsElementId].split('.').length;
            }
        }));

        this._changeView(this.mmsElementId, '');

    }

    $onChanges(onChangesObj:angular.IOnChangesObject) {
        handleChange(onChangesObj, 'mmsNumber', (newVal) => {
            this.number = newVal
        });
        handleChange(onChangesObj,'mmsElementId', this._changeView, true);
    }

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

   public elementTranscluded(elem: ElementObject, type: string) {
        if (elem) {
            if (elem._modified > this.modified && type !== 'Comment') {
                this.modified = elem._modified;
                if (elem._modifier) {
                    this.componentSvc.getModifier(elem._modifier).then((result) => {
                        this.modifier = result;
                    })
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

   // public setPeLineVisibility($event) {
   //      window.setTimeout(() => {
   //          var peContainer = $($event.currentTarget).closest('.add-pe-button-container');
   //          if (peContainer.find('.dropdown-menu').css('display') == 'none') {
   //              peContainer.find('hr').css('visibility', 'hidden');
   //          } else {
   //              peContainer.find('hr').css('visibility', 'visible');
   //          }
   //      });
   //  };

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
            var dups = this.presentationSvc.checkForDuplicateInstances(operand);
            if (dups.length > 0) {
                this.growl.warning("There are duplicates in this view, duplicates ignored!");
            }

            if (//data._numElements && data._numElements > 5000 &&
                    this.mmsCommitId && this.mmsCommitId !== 'latest') {
                //threshold where getting view elements in bulk takes too long and it's not latest
                //getting cached individual elements should be faster
                this.view = data;
                this.modified = data._modified;
                this.componentSvc.getModifier(data._modifier).then((result) => {
                    this.modifier = result;
                })
                return;
            }
            this.viewSvc.getViewElements(this.reqOb, 1)
            .finally(() => {
                this.view = data;
                this.modified = data._modified;
                this.componentSvc.getModifier(data._modifier).then((result) => {
                    this.modifier = result;
                })
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
     * @name veComponents.component:mmsView#toggleShowElements
     * @methodOf veComponents.component:mmsView
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
     * @name veComponents.component:mmsView#toggleShowComments
     * @methodOf veComponents.component:mmsView
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
     * @name veComponents.component:mmsView#toggleShowEdits
     * @methodOf veComponents.component:mmsView
     *
     * @description
     * toggle elements editor panel
     */
   public toggleShowEdits(value?: boolean) {
        this.showEdits = !this.showEdits;
        this.$element.toggleClass('editing');
        // Call the callback functions to clean up frames, show edits, and
        // re-open frames when needed:
        // for (let i = 0; i < this.presentationElemCleanUpFncs.length; i++) {
        //     this.presentationElemCleanUpFncs[i]();
        // }
    };


}

export let ViewComponent: VeComponentOptions = {
    selector: 'view',
    template: `
    <div id="{{$ctrl.mmsElementId}}" ng-class="{landscape: $ctrl.view._printLandscape}">
    <div ng-if="!$ctrl.noTitle">
        <h1 ng-if="$ctrl.mmsLink" class="view-title">
          <span class="ve-view-number">{{$ctrl.number}}</span> <view-link ng-class="{'docTitle-underlined': isHover}" mms-element-id="{{$ctrl.view.id}}" mms-doc-id="{{$ctrl.view.id}}"></view-link>
          <view-link class="open-document" ng-mouseover="hoverIn()" ng-mouseleave="hoverOut()" mms-element-id="{{$ctrl.view.id}}" mms-doc-id="{{$ctrl.view.id}}" 
            link-text="Open Document" link-class="btn btn-primary no-print" mms-external-link="true" link-icon-class="fa fa-share"></view-link>
        </h1>
    
        <h1 ng-if="!$ctrl.mmsLink" class="view-title h{{level}}">
            <span class="ve-view-number">{{$ctrl.number}}</span> <transclude-name mms-element-id="{{$ctrl.view.id}}" mms-project-id="{{$ctrl.view._projectId}}" mms-ref-id="{{$ctrl.view._refId}}"></transclude-name>
        </h1>
    
        <div class="ve-secondary-text last-modified no-print">
          Last Modified: {{$ctrl.modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email">{{ $ctrl.modifier.email }}</b><b ng-if="!$ctrl.modifier.email">{{ $ctrl.modifier }}</b>
        </div>
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
            <view-pe mms-instance-val="::instanceVal"></view-pe>
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
        mmsViewApi: '<',
        mmsNumber: '@',
        noTitle: '@'
    },
    controller: ViewController
}

veComponents.component(ViewComponent.selector,ViewComponent)