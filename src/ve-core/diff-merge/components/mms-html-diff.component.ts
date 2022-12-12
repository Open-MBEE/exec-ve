import angular from 'angular'

import { handleChange, onChangesCallback } from '@ve-utils/utils'

import { veCore } from '@ve-core'

import { HtmlRenderedDiff } from '../../../lib/html-rendered-diff'

import { VeComponentOptions } from '@ve-types/angular'

export class MmsHtmlDiffController implements angular.IComponentController {
    // Bindings
    mmsBaseHtml: string
    mmsComparedHtml: string
    public mmsDiffFinish?(): void

    private htmlRenderedDiff: HtmlRenderedDiff
    htmlDiffIdPrefix: string = 'htmlDiff-'
    htmlDiffId: string
    diffResult: string

    static $inject = ['$scope', '$timeout', 'growl']

    constructor(
        private $scope: angular.IScope,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService
    ) {
        this.htmlRenderedDiff = window.HtmlRenderedDiff
    }

    $onInit(): void {
        this.htmlDiffId = `${this.htmlDiffIdPrefix}${this.$scope.$id}`
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(onChangesObj, 'mmsBaseHtml', this.changeAction)
        handleChange(onChangesObj, 'mmsComparedHtml', this.changeAction)
    }

    $postLink(): void {
        if (this.mmsComparedHtml && this.mmsBaseHtml)
            this._performDiff(this.mmsBaseHtml, this.mmsComparedHtml)
    }

    public changeAction: onChangesCallback = (newBaseHtml, oldBaseHtml) => {
        if (
            this.mmsComparedHtml &&
            this.mmsBaseHtml &&
            newBaseHtml !== oldBaseHtml
        ) {
            this._performDiff(this.mmsBaseHtml, this.mmsComparedHtml)
        }
    }

    private _performDiff = (baseHtml: string, comparedHtml: string): void => {
        this.diffResult = this.htmlRenderedDiff.generateDiff(
            MmsHtmlDiffController._preformatHtml(baseHtml),
            MmsHtmlDiffController._preformatHtml(comparedHtml)
        )
        this.$timeout(() => {
            const diffContainer = $('#' + this.htmlDiffId)
            this._formatImgDiff(diffContainer)
            this._formatRowDiff(diffContainer)
        }).then(
            () => {
                if (this.mmsDiffFinish) this.mmsDiffFinish()
            },
            () => {
                this.growl.error('Problem performing diff.')
            }
        )
    }

    static _preformatHtml(html: string): string {
        return html
            .replace(/\r?\n|\r|\t/g, '')
            .replace('<p class="ng-scope">&nbsp;</p>', '')
    }

    private _formatImgDiff = (diffContainer: JQuery<HTMLElement>): void => {
        diffContainer.find('img').each((index, element) => {
            const img$ = $(element)
            const imgPatcherClass = img$.hasClass('patcher-insert')
                ? 'patcher-insert'
                : img$.hasClass('patcher-delete')
                ? 'patcher-delete'
                : null
            if (imgPatcherClass) {
                img$.wrap('<span class="' + imgPatcherClass + '">')
            }
        })
    }

    private _formatRowDiff = (diffContainer: JQuery<HTMLElement>): void => {
        diffContainer.find('tr').each((index, element) => {
            const tr$: JQuery<HTMLElement> = $(element)
            const trPatcherClass: string = tr$.hasClass('patcher-insert')
                ? 'patcher-insert'
                : tr$.hasClass('patcher-delete')
                ? 'patcher-delete'
                : ''
            if (trPatcherClass !== '') {
                tr$.removeClass(trPatcherClass)
                tr$.children().each((index, el) => {
                    $(el).addClass(trPatcherClass)
                })
            }
        })
    }
}

const MmsHtmlDiffComponent: VeComponentOptions = {
    selector: 'mmsHtmlDiff',
    template: `
    <div id="{{$ctrl.htmlDiffId}}" class="htmlDiff" ng-bind-html="$ctrl.diffResult" ng-hide="$ctrl.spin"></div>
    <i class="fa fa-spin fa-spinner" ng-show="$ctrl.spin"></i>
`,
    bindings: {
        mmsBaseHtml: '<',
        mmsComparedHtml: '<',
        mmsDiffFinish: '<',
    },
    controller: MmsHtmlDiffController,
}

veCore.component(MmsHtmlDiffComponent.selector, MmsHtmlDiffComponent)
