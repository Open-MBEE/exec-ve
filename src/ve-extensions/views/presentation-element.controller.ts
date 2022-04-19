import * as angular from "angular";
import {ViewHtmlService} from "./ViewHtml.service";
import {Utils} from "../../ve-core/utilities/Utils.service";

export class PresentationElementController implements angular.IComponentController {

    //Bindings
    protected viewData
    protected viewPe

    //Common
    protected $transcludeEl: JQuery<HTMLElement>;


    static $inject = ['$element', '$scope', '$compile', 'ViewHtmlService', 'Utils']
    constructor(protected $element: angular.IRootElementService, protected $scope: angular.IScope,
                protected $compile: angular.ICompileService, protected viewHtmlSvc: ViewHtmlService, protected utils: Utils) {
    }

    $postLink() {
        this.$transcludeEl = $(this.$element.children()[0]);
        this.$transcludeEl.html(this.getContent());
        $(this.$transcludeEl[0]).find('img').each((index, element) => {
            this.utils.fixImgSrc($(element));
        });
        this.$compile(this.$transcludeEl)(Object.assign(this.$scope.$new(),{$ctrl: this}));
    }

    protected getContent = (): string => {
        return 'Not Yet Implemented';
    };

}