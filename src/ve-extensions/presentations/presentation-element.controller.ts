import * as angular from "angular";
import {ViewHtmlService} from "./ViewHtml.service";
import {ExtUtilService} from "@ve-ext";

export class PresentationElementController implements angular.IComponentController {

    //Bindings
    protected viewData
    protected viewPe

    //Common
    protected $transcludeEl: JQuery<HTMLElement>;


    static $inject = ['$element', '$scope', '$compile', 'ViewHtmlService', 'ExtUtilService']
    constructor(protected $element: JQuery<HTMLElement>, protected $scope: angular.IScope,
                protected $compile: angular.ICompileService, protected viewHtmlSvc: ViewHtmlService, protected extUtilSvc: ExtUtilService) {
    }

    $postLink() {
        this.$element.empty();
        this.$transcludeEl = $(this.getContent());
        this.$transcludeEl.find('img').each((index, element) => {
            this.extUtilSvc.fixImgSrc($(element));
        });
        this.$element.append(this.$transcludeEl);
        this.$compile(this.$transcludeEl)(this.$scope);
    }

    protected getContent = (): string => {
        return 'Not Yet Implemented';
    };

}