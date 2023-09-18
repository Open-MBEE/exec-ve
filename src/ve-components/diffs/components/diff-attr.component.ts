import _ from 'lodash';

import { ViewController } from '@ve-components/presentations';
import { ExtensionService } from '@ve-components/services';
import { ElementService } from '@ve-utils/mms-api-client';
import { handleChange } from '@ve-utils/utils';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import { ElementObject, ElementsRequest, RequestObject } from '@ve-types/mms';

/**
 * @ngdoc directive
 * @name veComponent.component:diffAttr
 *
 * @requires veUtils/ElementService
 * @requires $compile
 * @requires ElementService
 *
 * *  Compares a element at two different refs/commits and generates a pretty diff-merge.
 * ## Example
 * <mms-diff-merge-attr mms-element-id="" mms-attr="name|doc|val"
 * (mms-project-id="" mms-ref-id="" mms-compare-ref-id=""
 * mms-commit-id="" mms-compare-commit-id="")></mms-diff-merge-attr>
 *
 * @param {string} attr Attribute to use -  ie `name`, `doc` or `value`
 * @param {string} elementId The id of the element to do comparison of
 * @param {string} projectId Base project ID for original/base element
 * @param {string} compareProjectId Compare project ID for compare element
 * @param {string=master} refId Base ref ID or master, defaults to current ref or master
 * @param {string=master} compareRefId Compare ref ID or master, defaults to base ref ID
 * @param {string=latest} commitId Base commit id, default is latest
 * @param {string=latest} compareCommitId Compare commit id, default is latest
 */

class DiffAttrController {
    //Bindings
    attr: string;
    elementId: string;
    compareElementId: string;
    projectId: string;
    compareProjectId: string;

    refId: string;
    compareRefId: string;

    commitId: string;
    compareCommitId: string;

    //Controllers
    mmsViewCtrl: ViewController;

    //Local
    diffLoading: boolean = false;
    baseNotFound: boolean = false;
    compNotFound: boolean = false;
    baseDeleted: boolean = false;
    compDeleted: boolean = false;
    private viewOrigin: RequestObject;
    baseElementHtml: string;
    comparedElementHtml: string;
    message: string;

    static $inject = [
        '$scope',
        '$timeout',
        'growl',
        'ElementService',
        'ExtensionService',
        '$compile',
        '$q',
        '$interval',
    ];

    constructor(
        private $scope: angular.IScope,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private extensionSvc: ExtensionService,
        private $compile: angular.ICompileService,
        private $q: VeQService,
        private $interval: angular.IIntervalService
    ) {}

    $onInit(): void {
        this.viewOrigin = this.mmsViewCtrl ? this.mmsViewCtrl.getElementOrigin() : null;
    }

    $postLink(): void {
        this.performDiff();
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(onChangesObj, 'commitId', this.changeAction);
        handleChange(onChangesObj, 'compareCommitId', this.changeAction);
    }

    public diffFinish = (): void => {
        this.diffLoading = false;
    };

    protected changeAction = (newVal, oldVal, firstChange): void => {
        if (!newVal || firstChange) {
            return;
        }
        if (oldVal !== newVal) this.performDiff();
    };
    protected performDiff = (): void => {
        if (this.attr && this.extensionSvc.getTagByType('transclude', this.attr) !== 'extension-error') {
            this.getDiff().then(
                (responses: angular.PromiseValue<ElementObject>[]) => {
                    const respForBaseElement = responses[0];
                    if (respForBaseElement.state === 'fulfilled') {
                        this._fullyRender(respForBaseElement.value).then(
                            (baseElementHtml) => {
                                this.baseElementHtml = $(baseElementHtml).children().html();
                            },
                            (reason) => {
                                this.growl.error(`Error getting Diff: ${reason.message}`);
                            }
                        );
                    } else {
                        if (
                            respForBaseElement.reason &&
                            (respForBaseElement.reason as VePromiseReason<ElementObject>).message &&
                            (respForBaseElement.reason as VePromiseReason<ElementObject>).message
                                .toLowerCase()
                                .includes('deleted')
                        ) {
                            this.baseDeleted = true;
                        } else {
                            this.baseNotFound = true;
                        }
                        this.baseElementHtml = '';
                    }

                    const respForComparedElement = responses[1];
                    if (respForComparedElement.state === 'fulfilled') {
                        this._fullyRender(respForComparedElement.value).then(
                            (comparedElementHtml) => {
                                this.comparedElementHtml = $(comparedElementHtml).children().html();
                            },
                            () => {
                                this.growl.error('Problem Rendering Diff');
                            }
                        );
                    } else {
                        if (
                            respForComparedElement.reason &&
                            (respForComparedElement.reason as VePromiseReason<ElementObject>).message &&
                            (respForComparedElement.reason as VePromiseReason<ElementObject>).message
                                .toLowerCase()
                                .includes('deleted')
                        ) {
                            this.compDeleted = true;
                        } else {
                            this.compNotFound = true;
                        }
                        this.comparedElementHtml = '';
                    }
                    this.message = this._checkElementExistence();
                },
                (reason) => {
                    this.growl.error(`Error getting Diff: ${reason.message}`);
                }
            );
        } else {
            this.growl.error('Unsupported Attribute for diff');
        }
    };

    public getDiff = (): VePromise<angular.PromiseValue<ElementObject>[]> => {
        this.diffLoading = true;

        const baseProjectId = this.projectId || (this.viewOrigin ? this.viewOrigin.projectId : null);
        const compareProjectId = this.compareProjectId || baseProjectId;

        const baseRefId = this.refId || (this.viewOrigin ? this.viewOrigin.refId : 'master');
        const compareRefId = this.compareRefId || baseRefId;

        const baseCommitId = this.commitId || 'latest';
        const compareCommitId = this.compareCommitId || 'latest';

        const baseElementId = this.elementId;
        const compareElementId = this.compareElementId || baseElementId;
        const baseReqOb: ElementsRequest<string> = {
            elementId: baseElementId,
            projectId: baseProjectId,
            refId: baseRefId,
            commitId: baseCommitId,
        };
        const compareReqOb: ElementsRequest<string> = {
            elementId: compareElementId,
            projectId: compareProjectId,
            refId: compareRefId,
            commitId: compareCommitId,
        };
        const isSame = _.isEqual(baseReqOb, compareReqOb);
        if (isSame) {
            return;
        }

        const baseElementPromise = this.elementSvc.getElement(baseReqOb);
        const comparedElementPromise = this.elementSvc.getElement(compareReqOb);
        return this.$q.allSettled([baseElementPromise, comparedElementPromise]);
    };

    protected _createElement = (type: string, reqOb: ElementsRequest<string>): JQuery<HTMLElement> => {
        const ignoreMathjaxAutoFormatting = type === 'doc' || type === 'val' || type === 'com';
        const html =
            '<mms-cf ' +
            (ignoreMathjaxAutoFormatting ? 'mms-generate-for-diff="mmsGenerateForDiff" ' : '') +
            'mms-cf-type="{{type}}" mms-element-id="{{mmsElementId}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}" mms-commit-id="{{commitId}}"></mms-cf>';
        const newScope = Object.assign(this.$scope.$new(), {
            type: type,
            mmsElementId: reqOb.elementId,
            mmsProjectId: reqOb.projectId,
            mmsRefId: reqOb.refId,
            commitId: reqOb.commitId,
            mmsGenerateForDiff: true,
        });
        return this.$compile(html)(newScope);
    };

    protected _fullyRender = (data: ElementObject): VePromise<string> => {
        const deferred = this.$q.defer<string>();
        const element = this._createElement(this.attr, {
            elementId: data.id,
            projectId: data._projectId,
            refId: data._refId,
            commitId: data._commitId,
        });
        const handler = this.$interval(() => {
            const baseHtml = element.html();
            if (!baseHtml.includes('(loading...)')) {
                this.$interval.cancel(handler);
                deferred.resolve(baseHtml);
            }
        }, 10);

        return deferred.promise;
    };

    protected _checkElementExistence = (): string => {
        let message = '';
        if (this.baseNotFound && this.compNotFound) {
            message = ' Both base and compare elements do not exist.';
        } else if (this.baseNotFound) {
            message = ' This is a new element.';
        } else if (this.compNotFound) {
            message = ' Comparison element does not exist.';
        }
        if (this.baseDeleted && this.compDeleted) {
            message = ' This element has been deleted.';
        } else if (this.baseDeleted) {
            message = ' Base element has been deleted.';
        } else if (this.compDeleted) {
            message = ' Comparison element has been deleted.';
        }
        return message;
    };
}

const DiffAttrComponent: VeComponentOptions = {
    selector: 'mmsDiffAttr',
    bindings: {
        elementId: '@mmsBaseElementId',
        comparedElementId: '@mmsCompareElementId',
        attr: '@mmsAttr',
        projectId: '@mmsBaseProjectId',
        compareProjectId: '@mmsCompareProjectId',
        refId: '@mmsBaseRefId',
        compareRefId: '@mmsCompareRefId',
        commitId: '<mmsBaseCommitId',
        compareCommitId: '<mmsCompareCommitId',
    },
    template: `
  <!--  <span ng-show="$ctrl.diffLoading">
    <i class="fa fa-spin fa-spinner"></i>
</span>
<span ng-hide="$ctrl.diffLoading"> -->
    <span class="text-info" ng-if="$ctrl.message"><i class="fa fa-info-circle"></i>{{$ctrl.message}}</span>
    <diff-html ng-if="$ctrl.baseElementHtml !== undefined && $ctrl.comparedElementHtml !== undefined" base="$ctrl.baseElementHtml" compare="$ctrl.comparedElementHtml" diff-callback="$ctrl.diffFinish"></diff-html>
<!-- </span> -->
`,
    controller: DiffAttrController,
    require: {
        mmsViewCtrl: '?^^view',
    },
};
veComponents.component('mmsDiffAttr', DiffAttrComponent);
veComponents.component(DiffAttrComponent.selector, DiffAttrComponent);
