import * as angular from "angular";
var mmsDirectives = angular.module('mmsDirectives');

let SaveConflictComponent: angular.ve.ComponentOptions = {
    selector: 'save-conflict',
    template: `
    <div class="modal-header"><h4>Conflict!</h4></div>
<div class="modal-body">
    <p>This element has been updated on the server since the last read
        and your save is rejected!</p>
    <hr/>
    <h6>Latest</h6>
    <mms-spec mms-type="element" mms-element="$ctrl.latest" no-edit="true"></mms-spec>
    <hr/>
    <p> Do you want to discard your edits and update to the latest or force an overwrite?</p>
</div>
<div class="modal-footer">
    <button class="btn btn-warning" ng-click="ok()">Discard Edits</button>
    <button class="btn btn-warning" ng-click="force()">Force Save</button>
    <!--<button class="btn btn-sm btn-primary" ng-click="merge()">Try Merge Edits</button>-->
    <button class="btn btn-default" ng-click="cancel()">Cancel (Do nothing)</button>
</div>
`,
    bindings: {
        resolve: "<",
        close: "<"
    },
    controller: class SaveConflictController implements angular.IComponentController {
        //bindings
        private close
                resolve

        //local
        public latest

        constructor() {}

        $onInit() {
            this.latest = this.resolve.latest();
        }

        ok() {
            this.close({$value: 'ok'});
        };

        cancel() {
            this.close({$value: 'cancel'});
        };

        force() {
            this.close({$value: 'force'});
        };

        merge() {
            this.close({$value: 'merge'});
        };
    }

}

mmsDirectives.component(SaveConflictComponent.selector,SaveConflictComponent);