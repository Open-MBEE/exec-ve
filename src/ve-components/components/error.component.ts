import _ from 'lodash';

import { ApplicationService } from '@ve-utils/application';

import { veUtils } from '@ve-utils';

import { VeComponentOptions } from '@ve-types/angular';

class ExtensionErrorController implements angular.IComponentController {
    //Bindings
    extType: string;
    extKind: string;
    errorMsg: string;
    mmsElementId: string;

    //Local Structure
    protected content: string;
    protected title: string;
    protected id: string;

    static $inject = ['growl', 'ApplicationService'];

    constructor(private growl: angular.growl.IGrowlService, private applicationSvc: ApplicationService) {}

    $onInit(): void {
        this.id = this.mmsElementId;
        if (!this.extKind && !this.extType) {
            this.title = 'Error';
            this.content = this.errorMsg ? this.errorMsg : 'There was a problem displaying your content.';
            return;
        }
        const localKind = this.extKind ? _.capitalize(this.extKind) : 'Element';
        const localExtType = _.capitalize(this.extType);

        this.title = 'Unsupported ' + localKind + ' Type: ' + localExtType;
        this.content =
            'This ' + localKind + ' has a rendering type: ' + localExtType + ' that is not supported by View Editor';
    }

    public copyToClipboard($event: JQuery.ClickEvent): void {
        this.applicationSvc.copyToClipboard($('#tooltipElementId'), $event).then(
            () => {
                this.growl.info('Copied to clipboard!', { ttl: 2000 });
            },
            (err) => {
                this.growl.error('Unable to copy: ' + err.message);
            }
        );
    }
}

const ExtensionErrorComponent: VeComponentOptions = {
    selector: 'error',
    template: `
    <span class="ve-error" uib-popover-template="'annotationTemplate'" popover-popup-close-delay="500" ng-bind-html="displayContent.inlineContent" popover-placement="top-left" popover-title="{{$ctrl.title}}"></span>
<script type="text/ng-template" id="annotationTemplate">
    <p>
        {{$ctrl.content}}
    </p>
    <a href="https://github.com/open-mbee/ve/issues">Report Issues/Contribute Your Idea</a>
    <p id="tooltipElementId" style="position: absolute; left: -1000px; top: -1000px; ">
        {{$ctrl.mmsElementId}}
    </p>
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy Element ID</button>
</script>
`,
    bindings: {
        extType: '<',
        extKind: '<',
        errorMsg: '<',
        mmsElementId: '<',
    },
    controller: ExtensionErrorController,
};

veUtils.component(ExtensionErrorComponent.selector, ExtensionErrorComponent);
