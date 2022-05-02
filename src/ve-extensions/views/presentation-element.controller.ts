import * as angular from "angular";
import {ViewHtmlService} from "./ViewHtml.service";
import {TransclusionService} from "../transclusions/Transclusion.service";

export class PresentationElementController implements angular.IComponentController {

    //Bindings
    protected viewData
    protected viewPe

    //Common
    protected $transcludeEl: JQuery<HTMLElement>;


    static $inject = ['$element', '$scope', '$compile', 'ViewHtmlService', 'TransclusionService']
    constructor(protected $element: JQuery<HTMLElement>, protected $scope: angular.IScope,
                protected $compile: angular.ICompileService, protected viewHtmlSvc: ViewHtmlService, protected transclusionSvc: TransclusionService) {
    }

    $postLink() {
        this.$element.empty();
        this.$transcludeEl = $(this.getContent());
        this.$transcludeEl.find('img').each((index, element) => {
            this.transclusionSvc.fixImgSrc($(element));
        });
        this.$element.append(this.$transcludeEl);
        this.$compile(this.$transcludeEl)(this.$scope);
    }

    protected getContent = (): string => {
        return 'Not Yet Implemented';
    };

}