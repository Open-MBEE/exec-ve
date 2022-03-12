import * as angular from "angular";

var mmsDirectives = angular.module('mmsDirectives');
// Used to sync value between input from the ckeditor and the uib-typeahead directive
let MMSMentionIntercept = {
    selector: 'mmsMentionIntercept',
    template:`
    <div class="mmsMention" id={{mmsMentionId}}>
    <input style="display:none;"
           uib-typeahead="mentionItem as mentionItem.name for mentionItem in fastCfListing | filter:{name: $viewValue} | limitTo:10"
           typeahead-template-url="customTemplate.html" typeahead-on-select='selectMentionItem($item, $model)'
           ng-model="selected" class="autocomplete-modal-typeahead form-control"
           placeholder="Type an element name to Cf" autofocus/>
</div>    
`,
    require: {
        ngModel: '^ngModel'
    },
    bindings: {
        mmsMentionInterceptValue: '<',
        mmsFastCf: '<'
    },
    controller: class MMSMentionInterceptController implements angular.IComponentController {
        public mmsMentionInterceptValue
        mmsFastCf

        private ngModel

        constructor() {
        }

        $onChanges(changes) {
            if (changes.mmsMentionInterceptValue) {
                this.ngModel.$setViewValue(changes.mmsMentionInterceptValue.currentValue);
                this.ngModel.$render();
            }
        }
    }
}

mmsDirectives.component(MMSMentionIntercept.selector, MMSMentionIntercept);