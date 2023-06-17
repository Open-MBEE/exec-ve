import { PresentationService } from '@ve-components/presentations/services/Presentation.service';
import { TreeService } from '@ve-components/trees';
import { RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { ElementService, UserService, ViewApi, ViewService } from '@ve-utils/mms-api-client';
import { handleChange, onChangesCallback } from '@ve-utils/utils';

import { veComponents } from '@ve-components';

import { VeComponentOptions } from '@ve-types/angular';
import {
    ElementObject,
    ElementsRequest,
    ExpressionObject,
    InstanceValueObject,
    RequestObject,
    UserObject,
    ValueObject,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms';

/**
 * @ngdoc directive
 * @name veComponents.component:View
 *
 * @requires ViewService
 * @requires ElementService
 * @requires $element
 * @requires growl
 *
 * * Given a view id, renders the view according to the json given by veUtils/ViewService
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
       public handler = (elementId) => {
            //element with elementId clicked in view
        };
       public showComments = () => {
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
    private mmsNumber: number;
    public noTitle: boolean;
    public buttonId: string;

    static $inject = [
        '$element',
        'growl',
        'PresentationService',
        'ViewService',
        'ElementService',
        'UserService',
        'EventService',
        'TreeService',
        'RootScopeService',
    ];
    private showEdits: boolean;
    private modified: string;
    private modifier: UserObject;
    private view: ViewObject;
    private reqOb: ElementsRequest<string> = {
        elementId: '',
        projectId: '',
        refId: '',
        commitId: '',
    };
    private processed: boolean;
    private isHover: boolean;
    private isSection: boolean;
    private level: number;
    private number: string = '';
    private showComments: boolean;
    private showElements: boolean;
    private showNumbering: boolean;
    public subs: Rx.IDisposable[];

    constructor(
        private $element: JQuery<HTMLElement>,
        private growl: angular.growl.IGrowlService,
        private presentationSvc: PresentationService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private userSvc: UserService,
        private eventSvc: EventService,
        private treeSvc: TreeService,
        private rootScopeSvc: RootScopeService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        this.reqOb = {
            elementId: this.mmsElementId,
            projectId: this.mmsProjectId,
            refId: this.mmsRefId,
            commitId: this.mmsCommitId,
        };
        this.processed = false;
        if (this.mmsNumber) {
            this.number = this.mmsNumber.toString(10);
        } else if (this.treeSvc.branch2viewNumber[this.mmsElementId]) {
            this.number = this.treeSvc.branch2viewNumber[this.mmsElementId];
        }
        this.showNumbering = this.rootScopeSvc.veNumberingOn();

        this.isSection = false;
        this.showElements = false;
        this.showComments = false;
        this.showEdits = false;

        this.subs.push(
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VEELEMENTSON, (data) => {
                this.toggleShowElements(data);
            }),
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VECOMMENTSON, (data) => {
                this.toggleShowComments(data);
            }),
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VENUMBERINGON, (data) => {
                this.showNumbering = data;
            }),
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VEEDITMODE, (data) => {
                this.toggleShowEdits(data);
            })
        );

        this.subs.push(
            this.eventSvc.binding<boolean>(TreeService.events.UPDATED, (data) => {
                if (!data) return;
                if (this.treeSvc.branch2viewNumber[this.mmsElementId]) {
                    this.level = this.treeSvc.branch2viewNumber[this.mmsElementId].split('.').length;
                }
            })
        );

        this._changeView(this.mmsElementId, '');
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(onChangesObj, 'mmsNumber', (newVal: string) => {
            this.number = newVal;
        });
        handleChange(onChangesObj, 'mmsElementId', this._changeView, true);
    }

    public isTranscludedElement = (elementName): boolean => {
        return (
            elementName === 'MMS-TRANSCLUDE-COM' ||
            elementName === 'MMS-TRANSCLUDE-DOC' ||
            elementName === 'MMS-TRANSCLUDE-ART' ||
            elementName === 'MMS-TRANSCLUDE-IMG' ||
            elementName === 'MMS-TRANSCLUDE-NAME' ||
            elementName === 'MMS-TRANSCLUDE-VAL'
        );
    };

    public isEditable = (): boolean => {
        return this.showEdits;
    };

    public transcludeClicked = (elementOb: ElementObject): void => {
        if (this.mmsViewApi && this.mmsViewApi.elementClicked && elementOb) this.mmsViewApi.elementClicked(elementOb);
    };

    public elementTranscluded = (elem: ElementObject, type: string): void => {
        if (elem) {
            if (elem._modified > this.modified && type !== 'Comment') {
                this.modified = elem._modified;
                if (elem._modifier) {
                    this.userSvc.getUserData(elem._modifier).then(
                        (result) => {
                            this.modifier = result;
                        },
                        () => {
                            this.modifier = { username: elem._modifier };
                        }
                    );
                }
            }
            if (this.mmsViewApi && this.mmsViewApi.elementTranscluded) this.mmsViewApi.elementTranscluded(elem, type);
        }
    };

    //INFO this was getWsAndVersion
    public getElementOrigin = (): RequestObject => {
        return {
            projectId: this.mmsProjectId,
            refId: this.mmsRefId,
            commitId: this.mmsCommitId,
        };
    };

    public getView = (): ViewObject => {
        // this view gets set in the viewlink fnc
        return this.view;
    };

    public hoverIn = (): void => {
        this.isHover = true;
    };
    public hoverOut = (): void => {
        this.isHover = false;
    };

    // public setPeLineVisibility($event) {
    //      window.setTimeout(() => {
    //          var peContainer = $($event.currentTarget).closest('.add-pe-button-container');
    //          if (peContainer.find('.dropdown-menu').css('display') == 'none') {
    // f             peContainer.find('hr').css('visibility', 'hidden');
    //          } else {
    //              peContainer.find('hr').css('visibility', 'visible');
    //          }
    //      });
    //  };

    private _changeView: onChangesCallback<string> = (newVal, oldVal) => {
        if (!newVal || (newVal === oldVal && this.processed)) return;

        this.processed = true;
        this.$element.addClass('isLoading');
        this.reqOb = {
            elementId: this.mmsElementId,
            projectId: this.mmsProjectId,
            refId: this.mmsRefId,
            commitId: this.mmsCommitId,
        };
        this.elementSvc
            .getElement<ViewObject | ViewInstanceSpec>(this.reqOb, 1)
            .then(
                (data) => {
                    //view accepts a section element
                    if (data.type === 'InstanceSpecification') {
                        this.isSection = true;
                    }
                    let operand: ValueObject[] = [];
                    if (data._contents && (data as ViewObject)._contents.operand) {
                        operand = (data as ViewObject)._contents.operand;
                    }
                    if (data.specification && (data as ViewInstanceSpec).specification.operand) {
                        operand = (data.specification as ExpressionObject<InstanceValueObject>).operand;
                    }
                    const dups = this.presentationSvc.checkForDuplicateInstances(operand);
                    if (dups.length > 0) {
                        this.growl.warning('There are duplicates in this view, duplicates ignored!');
                    }
                    if (data._veNumber) {
                        this.level = data._veNumber.split('.').length;
                    }
                    if (
                        //data._numElements && data._numElements > 5000 &&
                        this.mmsCommitId &&
                        this.mmsCommitId !== 'latest'
                    ) {
                        //threshold where getting view elements in bulk takes too long and it's not latest
                        //getting cached individual elements should be faster
                        this.view = data;
                        this.modified = data._modified;
                        this.userSvc.getUserData(data._modifier).then(
                            (result) => {
                                this.modifier = result;
                            },
                            () => {
                                this.modifier = { username: data._modifier };
                            }
                        );
                        return;
                    }
                    this.viewSvc.getViewElements(this.reqOb, 1).finally(() => {
                        this.view = data;
                        this.modified = data._modified;
                        this.userSvc.getUserData(data._modifier).then(
                            (result) => {
                                this.modifier = result;
                            },
                            () => {
                                this.modifier = { username: data._modifier };
                            }
                        );
                        this.$element.removeClass('isLoading');
                    });
                },
                (reason) => {
                    this.growl.error(`Getting View Error: ${reason.message}: ${this.mmsElementId}`);
                }
            )
            .finally(() => {
                if (this.view) this.$element.removeClass('isLoading');
            });
    };

    /**
     * @name veComponents.component:mmsView#toggleShowElements
     * toggle elements highlighting
     */
    public toggleShowElements = (value?: boolean): void => {
        if (typeof value !== 'undefined') {
            this.showElements = value;
        } else {
            this.showElements = !this.showElements;
        }
        if (this.showElements) {
            this.$element.addClass('outline');
        } else if (this.$element.hasClass('outline')) {
            this.$element.removeClass('outline');
        }
    };

    /**
     * @name veComponents.component:mmsView#toggleShowComments
     * toggle comments visibility
     */
    public toggleShowComments = (value?: boolean): void => {
        if (typeof value !== 'undefined') {
            this.showComments = value;
        } else {
            this.showComments = !this.showComments;
        }
        if (this.showComments) {
            this.$element.addClass('reviewing');
        } else if (this.$element.hasClass('reviewing')) {
            this.$element.removeClass('reviewing');
        }
    };

    /**
     * @name veComponents.component:mmsView#toggleShowEdits
     * toggle elements editor panel
     */
    public toggleShowEdits = (value?: boolean): void => {
        if (typeof value !== 'undefined') {
            this.showEdits = value;
        } else {
            this.showEdits = !this.showEdits;
        }
        if (this.showEdits) {
            this.$element.addClass('editing');
        } else if (this.$element.hasClass('editing')) {
            this.$element.removeClass('editing');
        }
        // Call the callback functions to clean up frames, show edits, and
        // re-open frames when needed:
        // for (let i = 0; i < this.presentationElemCleanUpFncs.length; i++) {
        //     this.presentationElemCleanUpFncs[i]();
        // }
    };
}

export const ViewComponent: VeComponentOptions = {
    selector: 'view',
    template: `
    <div id="{{$ctrl.mmsElementId}}" ng-class="{landscape: $ctrl.view._printLandscape}">
    <div ng-if="!$ctrl.noTitle">
        <div ng-if="!$ctrl.mmsLink" >
            <h1 class="view-title bm-level-{{$ctrl.level}}">
            <span class="ve-view-number" ng-show="$ctrl.showNumbering">{{$ctrl.view._veNumber}}</span> 
            <transclude-name mms-element-id="{{$ctrl.view.id}}" mms-project-id="{{$ctrl.view._projectId}}" mms-ref-id="{{$ctrl.view._refId}}" mms-watch-id="true"></transclude-name>
            </h1>
        </div>
        <div ng-if="$ctrl.mmsLink" class="view-title">
          <mms-view-link ng-class="{'docTitle-underlined': $ctrl.isHover}" mms-element-id="{{$ctrl.view.id}}" mms-doc-id="{{$ctrl.view.id}}"></mms-view-link>
          <mms-view-link class="open-document" ng-mouseover="$ctrl.hoverIn()" ng-mouseleave="$ctrl.hoverOut()" mms-element-id="{{$ctrl.view.id}}" mms-doc-id="{{$ctrl.view.id}}" 
            link-text="Open Document" link-class="btn btn-primary no-print" mms-external-link="true" link-icon-class="fa fa-share"></mms-view-link>
        </div>
        <div class="ve-secondary-text last-modified no-print">
          Last Modified: {{$ctrl.modified | date:'M/d/yy h:mm a'}} by <b ng-if="$ctrl.modifier.email">{{ $ctrl.modifier.email }}</b><b ng-if="!$ctrl.modifier.email">{{ $ctrl.modifier }}</b>
        </div>
    </div>
    <i ng-hide="$ctrl.view" class="fa fa-2x fa-spinner fa-spin"></i>

    <add-pe-menu mms-view="$ctrl.view" index="-1" class="add-pe-button-container no-print"></add-pe-menu>
   
    <div ng-if="$ctrl.view._contents">
        <!-- Cant use track by instanceVal.instance b/c of possible duplicate entries -->
        <div ng-repeat="instanceVal in $ctrl.view._contents.operand track by instanceVal.instanceId"> 
            <view-pe mms-instance-val="instanceVal"></view-pe>
            <add-pe-menu mms-view="$ctrl.view" index="$index" class="add-pe-button-container no-print"></add-pe-menu>
        </div>
    </div>
    <div ng-if="$ctrl.view.specification">
        <!-- Cant use track by instanceVal.instance b/c of possible duplicate entries -->
        <div ng-repeat="instanceVal in $ctrl.view.specification.operand track by instanceVal.instanceId"> 
            <view-pe mms-instance-val="instanceVal"></view-pe>
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
        noTitle: '@',
        buttonId: '<',
    },
    controller: ViewController,
};

veComponents.component(ViewComponent.selector, ViewComponent);
