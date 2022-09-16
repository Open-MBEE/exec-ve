import * as angular from "angular";

import { ViewController } from "@ve-ext/presentations";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementObject, ElementsResponse} from "@ve-types/mms";
import {ElementService} from "@ve-utils/mms-api-client";
import {handleChange} from "@ve-utils/utils";

import {veExt} from "@ve-ext";

/**
 * @ngdoc directive
 * @name veExt.component:mmsDiffAttr
 *
 * @requires veUtils/ElementService
 * @requires $compile
 * @requires $interval
 * @requires ElementService
 *
 *
 * @description
 *  Compares a element at two different refs/commits and generates a pretty diff.
 * ## Example
 * <mms-diff-attr mms-base-element-id="" mms-attr="name|doc|val"
 * (mms-base-project-id="" mms-base-ref-id="" mms-compare-ref-id=""
 * mms-base-commit-id="" mms-compare-commit-id="")></mms-diff-attr>
 *
 * @param {string} mmsAttr Attribute to use -  ie `name`, `doc` or `value`
 * @param {string} mmsBaseElementId The id of the element to do comparison of
 * @param {string} mmsBaseProjectId Base project ID for original/base element
 * @param {string} mmsCompareProjectId Compare project ID for compare element
 * @param {string=master} mmsBaseRefId Base ref ID or master, defaults to current ref or master
 * @param {string=master} mmsCompareRefId Compare ref ID or master, defaults to base ref ID
 * @param {string=latest} mmsBaseCommitId Base commit id, default is latest
 * @param {string=latest} mmsCompareCommitId Compare commit id, default is latest
 */
// function mmsDiffAttr($compile, $interval, $templateCache, $q, ElementService) {
//     const template = 'partials/mms-directives/mmsDiffAttr.html';

class MmsDiffAttrController implements angular.IComponentController {

    //Bindings
    mmsAttr;

    mmsBaseProjectId;
    mmsCompareProjectId;

    mmsBaseRefId;
    mmsCompareRefId;

    mmsBaseCommitId;
    mmsCompareCommitId;

    mmsBaseElementId;
    mmsCompareElementId;

    //Controllers
    mmsViewCtrl: ViewController

    //Local
    diffLoading: boolean = false;
    baseNotFound: boolean = false;
    compNotFound: boolean = false;
    baseDeleted: boolean = false;
    compDeleted: boolean = false;
    private viewOrigin: { refId: string; commitId: string; projectId: string };
    baseElementHtml: string;
    comparedElementHtml: string;
    message: string;

    static $inject = ['$scope', '$q', '$element', '$interval', '$compile', '$attrs', 'ElementService']

    constructor(private $scope: angular.IScope, private $q: angular.IQService, private $element: JQuery<HTMLElement>,
                private $interval: angular.IIntervalService, private $compile: angular.ICompileService,
                private $attrs: angular.IAttributes, private elementSvc: ElementService) {
    }

    $onInit() {
        this.viewOrigin = this.mmsViewCtrl ? this.mmsViewCtrl.getElementOrigin() : null;

    }

    $postLink() {
        this._setupDiff();
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj,'mmsBaseCommitId', this._commitIdChangeHandler);
        handleChange(onChangesObj,'mmsCompareCommitId', this._commitIdChangeHandler);
    }

    public diffFinish = () => {
        this.diffLoading = false;
    };

    protected _setupDiff = () => {

        this.diffLoading = true;

        const baseProjectId = this.mmsBaseProjectId || (this.viewOrigin ? this.viewOrigin.projectId : null);
        const compareProjectId = this.mmsCompareProjectId || baseProjectId;


        const baseRefId = this.mmsBaseRefId || (this.viewOrigin ? this.viewOrigin.refId : 'master');
        const compareRefId = this.mmsCompareRefId || baseRefId;

        const baseCommitId = this.mmsBaseCommitId || 'latest';
        const compareCommitId = this.mmsCompareCommitId || 'latest';

        const baseElementId = this.mmsBaseElementId;
        const compareElementId = this.mmsCompareElementId || baseElementId;

        const isSame = this._checkSameElement({
            baseElementId: baseElementId,
            compareElementId: compareElementId,

            baseCommitId: baseCommitId,
            compareCommitId: compareCommitId,

            baseRefId: baseRefId,
            compareRefId: compareRefId,

            baseProjectId: baseProjectId,
            compareProjectId: compareProjectId
        });
        if (isSame) {
            return;
        }

        const baseElementPromise = this._getElementData(baseProjectId, baseRefId, baseCommitId, baseElementId);
        const comparedElementPromise = this._getElementData(compareProjectId, compareRefId, compareCommitId, compareElementId);

        this.$q.allSettled([baseElementPromise, comparedElementPromise]).then((responses: angular.PromiseValue<ElementObject>[]) => {
                let message;

                const respForBaseElement = responses[0];
                if (respForBaseElement.state === 'fulfilled') {
                    this._fullyRender(respForBaseElement.value, (baseElementHtml) => {
                        this.baseElementHtml = baseElementHtml;
                    });
                } else {
                    message = respForBaseElement.reason.message;
                    if (message && message.toLowerCase().includes("deleted")) {
                        this.baseDeleted = true;
                    } else {
                        this.baseNotFound = true;
                    }
                    this.baseElementHtml = '';
                }

                const respForComparedElement = responses[1];
                if(respForComparedElement.state === 'fulfilled') {
                    this._fullyRender(respForComparedElement.value, (comparedElementHtml) => {
                        this.comparedElementHtml = comparedElementHtml;
                    });
                } else {
                    message = respForComparedElement.reason.message;
                    if (message && message.toLowerCase().includes("deleted")) {
                        this.compDeleted = true;
                    } else {
                        this.compNotFound = true;
                    }
                    this.comparedElementHtml = '';
                }
                this.message = this._checkElementExistence();

            });
        }

    protected _commitIdChangeHandler = (newVal, oldVal) => {
            if (newVal !== oldVal) {
                this._setupDiff();
            }
        }

    protected _getElementData(projectId: string, refId: string, commitId: string, elementId: string): angular.IPromise<ElementObject> {
        return this.elementSvc.getElement({
            projectId:  projectId,
            elementId:  elementId,
            refId:      refId,
            commitId:   commitId
        });
    }

    protected _createElement = (type, mmsElementId, mmsProjectId, mmsRefId, mmsCommitId) => {
        let html;
        const ignoreMathjaxAutoFormatting = type === 'doc' || type === 'val' || type === 'com';
        html = '<mms-cf ' + (ignoreMathjaxAutoFormatting ? 'mms-generate-for-diff="mmsGenerateForDiff" ' : '') +  'mms-cf-type="{{type}}" mms-element-id="{{mmsElementId}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}" mms-commit-id="{{mmsCommitId}}"></mms-cf>';
        const newScope = Object.assign(this.$scope.$new(), {
            type: type,
            mmsElementId: mmsElementId,
            mmsProjectId: mmsProjectId,
            mmsRefId: mmsRefId,
            mmsCommitId: mmsCommitId,
            mmsGenerateForDiff: true
        });
        return this.$compile(html)(newScope);
    }

    protected _fullyRender = (data: ElementObject, finishRenderCb: (baseHtml: string) => void) => {
         const element = this._createElement(this.mmsAttr, data.id, data._projectId, data._refId, data._commitId);
         const handler = this.$interval(() => {
             const baseHtml = element.html();
             if (!baseHtml.includes("(loading...)")) {
                this.$interval.cancel(handler);
                finishRenderCb(baseHtml);
             }
         }, 10);
        }



    protected _checkElementExistence = () => {
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
            } else if (this.baseDeleted){
                message = ' Base element has been deleted.';
            } else if (this.compDeleted){
                message = ' Comparison element has been deleted.';
            }
            return message;
        }

    protected _checkSameElement = (data) => {
            if ( (data.baseCommitId !== 'latest' && data.baseCommitId === data.compareCommitId ) ||
                (data.baseCommitId === 'latest' && data.baseCommitId === data.compareCommitId && data.baseElementId === data.compareElementId && data.baseProjectId === data.compareProjectId && data.baseRefId === data.compareRefId )) {
                this.message = ' Comparing same version.';
                this.diffFinish();
                return true;
            }
        }
    }

let MmsDiffAttrComponent: VeComponentOptions = {
    selector: 'mmsDiffAttr',
    bindings: {
        mmsAttr: '@',

        mmsBaseProjectId: '@',
        mmsCompareProjectId: '@',

        mmsBaseRefId: '@',
        mmsCompareRefId: '@',

        mmsBaseCommitId: '@',
        mmsCompareCommitId: '@',

        mmsBaseElementId: '@',
        mmsCompareElementId: '@'
    },
    template: `
    <span ng-show="$ctrl.diffLoading">
    <i class="fa fa-spin fa-spinner"></i>
</span>
<span ng-hide="$ctrl.diffLoading">
    <span class="text-info" ng-if="$ctrl.message"><i class="fa fa-info-circle"></i>{{$ctrl.message}}</span>
    <mms-html-diff ng-if="$ctrl.baseElementHtml !== 'undefined' && $ctrl.comparedElementHtml !== 'undefined'" mms-base-html="$ctrl.baseElementHtml" mms-compared-html="$ctrl.comparedElementHtml" mms-diff-finish="$ctrl.diffFinish"></mms-html-diff>
</span>
`,
    controller: MmsDiffAttrController,
    require: {
        mmsViewCtrl: '?^^view'
    }
};


veExt.component(MmsDiffAttrComponent.selector, MmsDiffAttrComponent);
