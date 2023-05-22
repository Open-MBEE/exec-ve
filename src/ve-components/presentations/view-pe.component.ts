import $ from 'jquery';

import { ViewController } from '@ve-components/presentations/view.component';
import { ExtensionService } from '@ve-components/services';
import { TreeService } from '@ve-components/trees';
import { EventService } from '@ve-utils/core';
import { ElementService, ViewService } from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromiseReason } from '@ve-types/angular';
import {
    ElementObject,
    ElementsRequest,
    InstanceSpecObject,
    InstanceValueObject,
    PresentationInstanceObject,
} from '@ve-types/mms';

/**
 * @ngdoc component
 * @name veComponents.component:mmsViewPresentationElem
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
 * * Given a InstanceVal, parses the element reference tree to get the corresponding
 * presentation element, and renders it in the view
 *
 * @param {Object} mmsInstanceVal A InstanceValue json object
 * @param {Object} mmsParentSection the parent section if available
 */
export class ViewPresentationElemController implements angular.IComponentController {
    private mmsInstanceVal: InstanceValueObject;
    private mmsParentSection: InstanceSpecObject;

    private viewCtrl: ViewController;

    public subs: Rx.IDisposable[];

    public presentationElemLoading: boolean;
    public instanceSpec: InstanceSpecObject;
    public presentationElem: PresentationInstanceObject | ElementObject;
    public peNumber: string;

    static $inject = [
        '$scope',
        '$element',
        '$timeout',
        '$location',
        '$anchorScroll',
        '$compile',
        'growl',
        'ViewService',
        'ElementService',
        'TreeService',
        'ExtensionService',
        'EventService',
    ];
    constructor(
        private $scope: angular.IScope,
        private $element: JQuery<HTMLElement>,
        private $timeout: angular.ITimeoutService,
        private $location: angular.ILocationService,
        private $anchorScroll: angular.IAnchorScrollService,
        private $compile: angular.ICompileService,
        private growl: angular.growl.IGrowlService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private treeSvc: TreeService,
        private extensionSvc: ExtensionService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.presentationElemLoading = true;
        this.eventSvc.$init(this);

        if (!this.mmsInstanceVal || !this.mmsInstanceVal.instanceId) {
            this.$element.html('<span class="ve-error">Reference is null</span>');
            return;
        }
        let projectId: string = null;
        let refId: string = null;
        let commitId: string = null;
        if (this.viewCtrl) {
            const viewVersion = this.viewCtrl.getElementOrigin();
            projectId = viewVersion.projectId;
            refId = viewVersion.refId;
            commitId = viewVersion.commitId;
        }
        // Parse the element reference tree for the presentation element:
        this.$element.addClass('isLoading');
        const reqOb = {
            elementId: this.mmsInstanceVal.instanceId,
            projectId: projectId,
            refId: refId,
            commitId: commitId,
            //includeRecentVersionElement: true,
        };
        this.elementSvc
            .getElement(reqOb, 1)
            .then(
                (instanceSpec) => {
                    this.viewSvc.getViewElements(reqOb, 1).finally(() => {
                        this.instanceSpec = instanceSpec;
                        this.presentationElem = this.viewSvc.getPresentationInstanceObject(instanceSpec);
                        this.presentationElemLoading = false;
                        if (this.viewCtrl) {
                            this.viewCtrl.elementTranscluded(instanceSpec, this.presentationElem.type);
                        }
                        this.$element.on('click', (e) => {
                            if (this.viewCtrl) this.viewCtrl.transcludeClicked(instanceSpec);
                            e.stopPropagation();
                        });
                        const tag = this.extensionSvc.getTagByType('present', this.presentationElem.type);

                        const newPe = $(
                            '<div id="' + this.instanceSpec.id + '" ng-if="!$ctrl.presentationElemLoading"></div>'
                        );
                        $(newPe).append(
                            '<' +
                                tag +
                                ' pe-object="$ctrl.presentationElem" instance-spec="$ctrl.instanceSpec" pe-number="$ctrl.peNumber">' +
                                '</' +
                                tag +
                                '>'
                        );
                        $(this.$element).append(newPe);
                        this.$compile(newPe)(this.$scope);
                    });
                },
                (reason) => {
                    this._error(reqOb, reason);
                }
            )
            .finally(() => {
                this.$element.removeClass('isLoading');
            });
    }

    public getInstanceSpec = (): InstanceSpecObject => {
        return this.instanceSpec;
    };

    public getInstanceVal = (): InstanceValueObject => {
        return this.mmsInstanceVal;
    };

    public getPresentationElement = (): ElementObject | PresentationInstanceObject => {
        return this.presentationElem;
    };

    public getParentSection = (): InstanceSpecObject => {
        return this.mmsParentSection;
    };

    private _error = (reqOb: ElementsRequest<string>, reason: VePromiseReason<unknown>): void => {
        if (reason.status === 500) {
            this.$element.html(
                '<span class="ve-error">View element reference error: ' +
                    this.mmsInstanceVal.instanceId +
                    ' invalid specification</span>'
            );
        } else {
            this.$element.empty();

            const annotation = $(
                '<annotation mms-element-id="::elementId" mms-recent-element="::recentElement" mms-type="::type"></annotation>'
            );
            this.$element.append(annotation);
            this.$compile(annotation)(
                Object.assign(this.$scope.$new(), {
                    elementId: reqOb.elementId,
                    recentElement: reason.recentVersionOfElement,
                    type: 'presentation',
                })
            );
        }
    };
}

const ViewPeComponent: VeComponentOptions = {
    selector: 'viewPe',
    template: `
    <div ng-if="$ctrl.presentationElemLoading" class="fa fa-spinner fa-spin"></div>  
`,
    require: {
        viewCtrl: '?^^view',
    },
    bindings: {
        mmsInstanceVal: '<',
        mmsParentSection: '<',
    },
    controller: ViewPresentationElemController,
};

veComponents.component(ViewPeComponent.selector, ViewPeComponent);
