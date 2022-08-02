import * as angular from "angular";
import {veCore} from "@ve-core";

// Used to sync value between input from the ckeditor and the uib-typeahead directive
let MMSMentionIntercept = {
    selector: 'mentionIntercept',
    template:`
    <div class="mmsMention" id="{{$ctrl.mmsMentionId}}">
    <input style="display:none;"
           uib-typeahead="mentionItem as mentionItem.name for mentionItem in $ctrl.mmsFastCf | filter:{name: $viewValue} | limitTo:10"
           typeahead-template-url="customTemplate.html" typeahead-on-select='$ctrl.selectMentionItem($item, $model)'
           ng-model="selected" class="autocomplete-modal-typeahead form-control"
           placeholder="Type an element name to Cf" autofocus/>
</div>    
`,
    require: {
        ngModel: '^ngModel',
        mentionCtrl: '^^mention'
    },
    bindings: {
        mmsMentionInterceptValue: '<',
        mmsFastCf: '<',
        mmsMentionId: '<'
    },
    controller: class MMSMentionInterceptController implements angular.IComponentController {
        public mmsMentionInterceptValue
        mmsFastCf

        private ngModel
        mentionCtrl

        constructor() {
        }

        $onChanges(changes) {
            if (changes.mmsMentionInterceptValue) {
                this.ngModel.$setViewValue(changes.mmsMentionInterceptValue.currentValue);
                this.ngModel.$render();
            }
        }

        public selectMentionItem($item, $model) {
            this.mentionCtrl.selectMentionItem($item);
        }

    }
}

veCore.component(MMSMentionIntercept.selector, MMSMentionIntercept);