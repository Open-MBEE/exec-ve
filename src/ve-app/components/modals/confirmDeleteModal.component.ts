import * as angular from 'angular';
var veApp = angular.module('veApp');

let ConfirmDeleteModalComponent: angular.ve.ComponentOptions = {
    selector: 'confirmDeleteModal',
    template: `
    <div class="modal-header">
    <h4>Confirm Remove</h4>
</div>

<div class="modal-body">
    <p>Are you sure you want to remove {{$ctrl.type}} <b>&ldquo;{{$ctrl.name}}&rdquo;</b>?</p>
    <p ng-if="$ctrl.type === 'edit'">
      There are unsaved modifications to this element, which may include html beautification.<br/>
      Are you sure you want to discard them? 
    </p>
    <p ng-if="$ctrl.type === 'view'">This will remove <b>&ldquo;{{$ctrl.name}}&rdquo;</b> from the hierarchy, but you can still access it in search.</p>
    <p ng-if="$ctrl.type === 'Document' || $ctrl.type === 'group'">This will remove <b>&ldquo;{{$ctrl.name}}&rdquo;</b> from the project navigation, but you can still access it in search.</p>
</div>

<div class="modal-footer">
    <button class="btn btn-warning" ng-click="$ctrl.ok()">Remove <i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i></button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        modalInstance: "<",
        resolve: "<",
        close: "<",
        dismiss: "<"
    },
    controller: class ConfirmDeleteModalController implements angular.IComponentController {

        $inject = ['growl'];

        private growl;

        //bindings
        private modalInstance;
        private resolve;
        private close;
        private dismiss;

        //local
        public oking
        public type
        public name

        private treeApi


        constructor(growl) {
            this.growl = growl;
        }

        $onInit() {
            this.oking = false;
            this.type = this.resolve.getType();
            this.name = this.resolve.getName();
        }

        ok() {
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;
            this.resolve.ok().then((result) => {

                if (result === true) {
                    this.growl.success(this.type + " Removed");
                    this.oking = false;
                    this.close({ $value: 'ok'});
                } else {
                    if (result.message) {
                        this.growl.error(this.type + ' Removal Error: ' + result.message);
                    }
                    this.oking = false;
                    this.dismiss({ $value: result });
                }
            });
        };

        cancel()
        {
            this.dismiss();
        };
    }
};

veApp.component(ConfirmDeleteModalComponent.selector,ConfirmDeleteModalComponent);