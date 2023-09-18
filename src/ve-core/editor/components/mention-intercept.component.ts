import { MMSMentionController } from '@ve-core/editor/components/mention.component';

import { veCore } from '@ve-core';

import { ElementObject } from '@ve-types/mms';

class MMSMentionInterceptController implements angular.IComponentController {
    public mmsMentionInterceptValue: string;
    mmsFastCf: ElementObject[];

    private ngModel: angular.INgModelController;
    mentionCtrl: MMSMentionController;

    $onChanges(changes: angular.IOnChangesObject): void {
        if (changes.mmsMentionInterceptValue) {
            this.ngModel.$setViewValue(changes.mmsMentionInterceptValue.currentValue);
            this.ngModel.$render();
        }
    }

    public selectMentionItem($item: ElementObject): void {
        this.mentionCtrl.selectMentionItem($item);
    }
}

// Used to sync value between input from the ckeditor and the uib-typeahead directive
const MMSMentionIntercept = {
    selector: 'mentionIntercept',
    template: `
    <div class="mention" id="{{$ctrl.mmsMentionId}}">
    <input style="display:none;"
           uib-typeahead="mentionItem as mentionItem.name for mentionItem in $ctrl.mmsFastCf | filter:{name: $viewValue} | limitTo:10"
           typeahead-template-url="customTemplate.html" typeahead-on-select='$ctrl.selectMentionItem($item, $model)'
           ng-model="selected" class="autocomplete-modal-typeahead form-control"
           placeholder="Type an element name to Cf" autofocus/>
</div>    
`,
    require: {
        ngModel: '^ngModel',
        mentionCtrl: '^^mention',
    },
    bindings: {
        mmsMentionInterceptValue: '<',
        mmsFastCf: '<',
        mmsMentionId: '<',
    },
    controller: MMSMentionInterceptController,
};

veCore.component(MMSMentionIntercept.selector, MMSMentionIntercept);
