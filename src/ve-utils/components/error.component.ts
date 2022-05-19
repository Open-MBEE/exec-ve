import angular from "angular";
import _ from "lodash";

import {VeComponentOptions} from "@ve-types/view-editor";
import {veUtils} from "@ve-utils";
import {UtilsService} from "@ve-utils/services";


class ExtensionErrorController implements angular.IComponentController {

    //Bindings
    extType
    extKind
    mmsElementId

    //Local Structure
    protected content: string
    protected title: string
    protected id: string

    static $inject = ['UtilsService']

    constructor(private utilsSvc: UtilsService) {
    }

    $onInit() {
        let localKind = (this.extKind) ? _.capitalize(this.extKind) : "Element"
        let localExtType = _.capitalize(this.extType);

        this.id = this.mmsElementId
        this.title = "Unsupported " + localKind + " Type: " + localExtType;
        this.content = "This " + localKind + " has a rendering type: " + localExtType + " that is not supported by View Editor"
    }

    public copyToClipboard($event) {
        this.utilsSvc.copyToClipboard($('#tooltipElementId'), $event);
    };
}

let ExtensionErrorComponent: VeComponentOptions = {
    selector: 'extensionError',
    template: `
    <span class="mms-error" uib-popover-template="'annotationTemplate'" popover-popup-close-delay="500" ng-bind-html="displayContent.inlineContent" popover-placement="top-left" popover-title="{{$ctrl.title}}"></span>
<script type="text/ng-template" id="annotationTemplate">
    <p>
        {{$ctrl.content}}
    </p>
    <a href="https://github.com/open-mbee/ve">Contribute Your Idea</a>
    <p id="tooltipElementId" style="position: absolute; left: -1000px; top: -1000px; ">
        {{$ctrl.mmsElementId}}
    </p>
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy Element ID</button>
</script>
`,
    bindings: {
        extType: "<",
        extKind: "<",
        mmsElementId: "<"
    },
    controller: ExtensionErrorController
}

veUtils.component(ExtensionErrorComponent.selector, ExtensionErrorComponent);