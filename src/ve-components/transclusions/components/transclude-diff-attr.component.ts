import angular from 'angular'
import _ from 'lodash'

import { ViewController } from '@ve-components/presentations'
import { ComponentService, ExtensionService } from '@ve-components/services'
import { ITransclusion, Transclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import { AuthService, ElementService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    EventService,
    ImageService,
    MathJaxService,
    UtilsService,
} from '@ve-utils/services'
import { handleChange } from '@ve-utils/utils'

import { veComponents } from '@ve-components'

import {
    VeComponentOptions,
    VePromise,
    VePromiseReason,
    VeQService,
} from '@ve-types/angular'
import { ElementObject, ElementsRequest, RequestObject } from '@ve-types/mms'

/**
 * @ngdoc directive
 * @name veComponent.component:mmsDiffAttr
 *
 * @requires veUtils/ElementService
 * @requires $compile
 * @requires ElementService
 *
 * *  Compares a element at two different refs/commits and generates a pretty diff-merge.
 * ## Example
 * <mms-diff-merge-attr mms-base-element-id="" mms-attr="name|doc|val"
 * (mms-base-project-id="" mms-base-ref-id="" mms-compare-ref-id=""
 * mms-base-commit-id="" mms-compare-commit-id="")></mms-diff-merge-attr>
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

class MmsDiffAttrController extends Transclusion implements ITransclusion {
    //Bindings
    mmsAttr: string

    mmsBaseProjectId: string
    mmsCompareProjectId: string

    mmsBaseRefId: string
    mmsCompareRefId: string

    mmsBaseCommitId: string
    mmsCompareCommitId: string

    mmsBaseElementId: string
    mmsCompareElementId: string

    //Controllers
    mmsViewCtrl: ViewController

    //Local
    diffLoading: boolean = false
    baseNotFound: boolean = false
    compNotFound: boolean = false
    baseDeleted: boolean = false
    compDeleted: boolean = false
    private viewOrigin: RequestObject
    baseElementHtml: string
    comparedElementHtml: string
    message: string

    static $inject = [...Transclusion.$inject, '$interval']

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        imageSvc: ImageService,
        private $interval: angular.IIntervalService
    ) {
        super(
            $q,
            $scope,
            $compile,
            $element,
            growl,
            componentSvc,
            elementSvc,
            utilsSvc,
            schemaSvc,
            authSvc,
            eventSvc,
            mathJaxSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        )
        this.cfType = 'diff'
        this.cfTitle = 'diff'
        this.cfKind = 'Diff'
        this.checkCircular = false
    }

    $onInit(): void {
        super.$onInit()
        this.viewOrigin = this.mmsViewCtrl
            ? this.mmsViewCtrl.getElementOrigin()
            : null
    }

    $postLink(): void {
        this.changeAction(this.mmsBaseElementId, '', false)
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(onChangesObj, 'mmsBaseCommitId', this.changeAction)
        handleChange(onChangesObj, 'mmsCompareCommitId', this.changeAction)
        handleChange(onChangesObj, 'mmsBaseElementId', this.changeAction)
        handleChange(onChangesObj, 'mmsCompareElementId', this.changeAction)
    }

    public diffFinish = (): void => {
        this.diffLoading = false
    }

    public recompile = (): void => {
        this.getDiff().then(
            (responses: angular.PromiseValue<ElementObject>[]) => {
                let message

                const respForBaseElement = responses[0]
                if (respForBaseElement.state === 'fulfilled') {
                    this._fullyRender(respForBaseElement.value).then(
                        (baseElementHtml) => {
                            this.baseElementHtml = $(baseElementHtml)
                                .children()
                                .html()
                        },
                        (reason) => {
                            this.growl.error(
                                `Error getting Diff: ${reason.message}`
                            )
                        }
                    )
                } else {
                    if (
                        respForBaseElement.reason &&
                        (
                            respForBaseElement.reason as VePromiseReason<ElementObject>
                        ).message &&
                        (
                            respForBaseElement.reason as VePromiseReason<ElementObject>
                        ).message
                            .toLowerCase()
                            .includes('deleted')
                    ) {
                        this.baseDeleted = true
                    } else {
                        this.baseNotFound = true
                    }
                    this.baseElementHtml = ''
                }

                const respForComparedElement = responses[1]
                if (respForComparedElement.state === 'fulfilled') {
                    this._fullyRender(respForComparedElement.value).then(
                        (comparedElementHtml) => {
                            this.comparedElementHtml = $(comparedElementHtml)
                                .children()
                                .html()
                        },
                        () => {
                            this.growl.error('Problem Rendering Diff')
                        }
                    )
                } else {
                    if (
                        respForComparedElement.reason &&
                        (
                            respForComparedElement.reason as VePromiseReason<ElementObject>
                        ).message &&
                        (
                            respForComparedElement.reason as VePromiseReason<ElementObject>
                        ).message
                            .toLowerCase()
                            .includes('deleted')
                    ) {
                        this.compDeleted = true
                    } else {
                        this.compNotFound = true
                    }
                    this.comparedElementHtml = ''
                }
                this.message = this._checkElementExistence()
            },
            (reason) => {
                this.growl.error(`Error getting Diff: ${reason.message}`)
            }
        )
    }

    public getDiff = (): VePromise<angular.PromiseValue<ElementObject>[]> => {
        this.diffLoading = true

        const baseProjectId =
            this.mmsBaseProjectId ||
            (this.viewOrigin ? this.viewOrigin.projectId : null)
        const compareProjectId = this.mmsCompareProjectId || baseProjectId

        const baseRefId =
            this.mmsBaseRefId ||
            (this.viewOrigin ? this.viewOrigin.refId : 'master')
        const compareRefId = this.mmsCompareRefId || baseRefId

        const baseCommitId = this.mmsBaseCommitId || 'latest'
        const compareCommitId = this.mmsCompareCommitId || 'latest'

        const baseElementId = this.mmsBaseElementId
        const compareElementId = this.mmsCompareElementId || baseElementId
        const baseReqOb: ElementsRequest<string> = {
            elementId: baseElementId,
            projectId: baseProjectId,
            refId: baseRefId,
            commitId: baseCommitId,
        }
        const compareReqOb: ElementsRequest<string> = {
            elementId: compareElementId,
            projectId: compareProjectId,
            refId: compareRefId,
            commitId: compareCommitId,
        }
        const isSame = _.isEqual(baseReqOb, compareReqOb)
        if (isSame) {
            return
        }

        const baseElementPromise = this.elementSvc.getElement(baseReqOb)
        const comparedElementPromise = this.elementSvc.getElement(compareReqOb)
        return this.$q.allSettled([baseElementPromise, comparedElementPromise])
    }

    protected changeAction = (newVal, oldVal, firstChange): void => {
        if (!newVal || firstChange) {
            return
        }
        if (newVal !== oldVal) {
            this.recompile()
        }
    }

    protected _createElement = (
        type: string,
        reqOb: ElementsRequest<string>,
        callback: () => void
    ): JQuery<HTMLElement> => {
        const ignoreMathjaxAutoFormatting =
            type === 'doc' || type === 'val' || type === 'com'
        const html =
            '<mms-cf ' +
            (ignoreMathjaxAutoFormatting
                ? 'mms-generate-for-diff-merge="mmsGenerateForDiff" '
                : '') +
            'mms-cf-type="{{type}}" mms-element-id="{{mmsElementId}}" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}" mms-commit-id="{{mmsCommitId}}" mms-callback="mmsCallback()"></mms-cf>'
        const newScope = Object.assign(this.$scope.$new(), {
            type: type,
            mmsElementId: reqOb.elementId,
            mmsProjectId: reqOb.projectId,
            mmsRefId: reqOb.refId,
            mmsCommitId: reqOb.commitId,
            mmsGenerateForDiff: true,
            mmsCallback: callback,
        })
        return this.$compile(html)(newScope)
    }

    protected _fullyRender = (data: ElementObject): VePromise<string> => {
        const deferred = this.$q.defer<string>()
        const renderCallback = (): void => {
            const baseHtml = element.html()
            deferred.resolve(baseHtml)
        }
        const element = this._createElement(
            this.mmsAttr,
            {
                elementId: data.id,
                projectId: data._projectId,
                refId: data._refId,
                commitId: data._commitId,
            },
            renderCallback
        )

        return deferred.promise
    }

    protected _checkElementExistence = (): string => {
        let message = ''
        if (this.baseNotFound && this.compNotFound) {
            message = ' Both base and compare elements do not exist.'
        } else if (this.baseNotFound) {
            message = ' This is a new element.'
        } else if (this.compNotFound) {
            message = ' Comparison element does not exist.'
        }
        if (this.baseDeleted && this.compDeleted) {
            message = ' This element has been deleted.'
        } else if (this.baseDeleted) {
            message = ' Base element has been deleted.'
        } else if (this.compDeleted) {
            message = ' Comparison element has been deleted.'
        }
        return message
    }
}

const TranscludeDiffAttrComponent: VeComponentOptions = {
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
        mmsCompareElementId: '@',
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
        mmsViewCtrl: '?^^view',
    },
}

veComponents.component(
    TranscludeDiffAttrComponent.selector,
    TranscludeDiffAttrComponent
)
