import angular from "angular";
import _ from "lodash";

import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {veExt} from "../ve-extensions.module";
import {UtilsService} from "../../ve-utils/services/Utils.service";





class ExtensionErrorController implements angular.IComponentController {

    //Bindings
    extType
    elementType
    mmsElementId

    //Local Structure
    protected content: string
    protected title: string
    protected id: string

    static $inject = ['UtilsService']

    constructor(private utilsSvc: UtilsService) {
    }

    $onInit() {
        let localExtType = (this.extType) ? _.capitalize(this.extType) : "Element"
        let localType = _.capitalize(this.elementType);

        this.id = this.mmsElementId
        this.title = "Unsupported " + localExtType + " Type: " + localType;
        this.content = "This " + localExtType + " has a rendering type: " + localType + " that is not supported by View Editor"
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
        elementType: "<",
        mmsElementId: "<"
    },
    controller: ExtensionErrorController
}

veExt.component(ExtensionErrorComponent.selector, ExtensionErrorComponent);