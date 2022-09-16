import * as angular from "angular"

import {VeComponentOptions} from "@ve-types/view-editor";

import {veExt} from "@ve-ext";
import {handleChange, onChangesCallback} from "@ve-utils/utils";

export class MmsHtmlDiffController implements angular.IComponentController {

    // Bindings
    mmsBaseHtml: string
    mmsComparedHtml: string
    public mmsDiffFinish?(): void;

    private htmlRenderedDiff
    htmlDiffIdPrefix: string = 'htmlDiff-'
    htmlDiffId: string
    diffResult: string;

    static $inject = ['$scope', '$timeout'];

    constructor(private $scope: angular.IScope, private $timeout: angular.ITimeoutService) {
        this.htmlRenderedDiff = window.HtmlRenderedDiff;
    }

    $onInit() {
        this.htmlDiffId = this.htmlDiffIdPrefix + this.$scope.$id;

    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj,'mmsBaseHtml',this.changeAction);
        handleChange(onChangesObj,'mmsComparedHtml',this.changeAction);
    }

    $postLink() {
        if (this.mmsComparedHtml && this.mmsBaseHtml)
            this._performDiff(this.mmsBaseHtml, this.mmsComparedHtml);
    }

    public changeAction: onChangesCallback = (newBaseHtml, oldBaseHtml) => {
        if (this.mmsComparedHtml && this.mmsBaseHtml && newBaseHtml !== oldBaseHtml) {
            this._performDiff(this.mmsBaseHtml, this.mmsComparedHtml);
        }
    }


    private _performDiff = (baseHtml: string, comparedHtml: string) => {
        this.diffResult = this.htmlRenderedDiff.generateDiff(MmsHtmlDiffController._preformatHtml(baseHtml), MmsHtmlDiffController._preformatHtml(comparedHtml));
        this.$timeout(() => {
            var diffContainer = $('#' + this.htmlDiffId);
            this._formatImgDiff(diffContainer);
            this._formatRowDiff(diffContainer);
            this.mmsDiffFinish();
        });
    }

    static _preformatHtml(html) {
        return html.replace(/\r?\n|\r|\t/g, '').replace('<p class="ng-scope">&nbsp;</p>', '');
    }

     private _formatImgDiff = (diffContainer: JQuery<HTMLElement>) => {
    diffContainer
        .find('img')
        .each((index, element) => {
            var img$ = $(element);
            var imgPatcherClass = img$.hasClass('patcher-insert') ? 'patcher-insert' : img$.hasClass('patcher-delete') ? 'patcher-delete' : null;
            if (imgPatcherClass) {
                img$.wrap('<span class="' + imgPatcherClass + '">');
            }
        });
}

     private _formatRowDiff = (diffContainer: JQuery<HTMLElement>) => {
        diffContainer
        .find('tr')
        .each((index, element) => {
            var tr$: JQuery<HTMLElement> = $(element);
            var trPatcherClass: string = tr$.hasClass('patcher-insert') ? 'patcher-insert' : tr$.hasClass('patcher-delete') ? 'patcher-delete' : '';
            if (trPatcherClass !== '') {
                tr$.removeClass(trPatcherClass);
                tr$.children().each((index, el) => {
                    $(el).addClass(trPatcherClass);
                });
            }
        });
    }
}

let MmsHtmlDiffComponent: VeComponentOptions = {
    selector: "mmsHtmlDiff",
    template: `
    <div id="{{$ctrl.htmlDiffId}}" class="htmlDiff" ng-bind-html="$ctrl.diffResult"></div>
`,
    bindings: {
        mmsBaseHtml: '<',
        mmsComparedHtml: '<',
        mmsDiffFinish: '<'
    },
    controller: MmsHtmlDiffController
}

veExt.component(MmsHtmlDiffComponent.selector, MmsHtmlDiffComponent);
