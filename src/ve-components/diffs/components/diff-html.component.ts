import { handleChange } from '@ve-utils/utils';

import { veComponents } from '@ve-components';

import { HtmlRenderedDiff } from '../../../lib/html-rendered-diff';

import { VeComponentOptions } from '@ve-types/angular';

class DiffHtmlController {
    //bindings
    private base: string;
    private compare: string;
    private diffCallback: () => void;

    //local
    private htmlRenderedDiff: HtmlRenderedDiff;
    htmlDiffIdPrefix: string = 'html-diff-';
    htmlDiffId: string;
    diffResult: string;

    static $inject = ['$scope', '$timeout', 'growl'];

    constructor(
        private $scope: angular.IScope,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService
    ) {
        this.htmlRenderedDiff = window.HtmlRenderedDiff;
    }

    $onInit(): void {
        this.htmlDiffId = `${this.htmlDiffIdPrefix}${this.$scope.$id}`;
        this.performDiff();
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(onChangesObj, 'base', this.performDiff);
        handleChange(onChangesObj, 'compare', this.performDiff);
    }
    protected performDiff = (): void => {
        this.diffResult = this.htmlRenderedDiff.generateDiff(
            DiffHtmlController._preformatHtml(this.base),
            DiffHtmlController._preformatHtml(this.compare)
        );
        this.$timeout(() => {
            const diffContainer = $('#' + this.htmlDiffId);
            this._formatImgDiff(diffContainer);
            this._formatRowDiff(diffContainer);
        }).then(
            () => {
                if (this.diffCallback) this.diffCallback();
            },
            () => {
                this.growl.error('Problem performing diff.');
            }
        );
    };

    static _preformatHtml(html: string): string {
        return html.replace(/\r?\n|\r|\t/g, '').replace('<p class="ng-scope">&nbsp;</p>', '');
    }

    private _formatImgDiff = (diffContainer: JQuery<HTMLElement>): void => {
        diffContainer.find('img').each((index, element) => {
            const img$ = $(element);
            const imgPatcherClass = img$.hasClass('patcher-insert')
                ? 'patcher-insert'
                : img$.hasClass('patcher-delete')
                ? 'patcher-delete'
                : null;
            if (imgPatcherClass) {
                img$.wrap('<span class="' + imgPatcherClass + '">');
            }
        });
    };

    private _formatRowDiff = (diffContainer: JQuery<HTMLElement>): void => {
        diffContainer.find('tr').each((index, element) => {
            const tr$: JQuery<HTMLElement> = $(element);
            const trPatcherClass: string = tr$.hasClass('patcher-insert')
                ? 'patcher-insert'
                : tr$.hasClass('patcher-delete')
                ? 'patcher-delete'
                : '';
            if (trPatcherClass !== '') {
                tr$.removeClass(trPatcherClass);
                tr$.children().each((index, el) => {
                    $(el).addClass(trPatcherClass);
                });
            }
        });
    };
}

const DiffHtmlComponent: VeComponentOptions = {
    selector: 'diffHtml',
    template: `
    <div id="{{$ctrl.htmlDiffId}}" class="htmlDiff" ng-bind-html="$ctrl.diffResult" ng-hide="$ctrl.spin"></div>
    <i class="fa fa-spin fa-spinner" ng-show="$ctrl.spin"></i>
`,
    bindings: {
        base: '<',
        compare: '<',
        diffCallback: '&',
    },
    controller: DiffHtmlController,
};

veComponents.component(DiffHtmlComponent.selector, DiffHtmlComponent);
