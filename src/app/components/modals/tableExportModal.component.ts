import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');

let TableExportModalComponent: angular.ve.ComponentOptions = {
    selector: 'tableExport',
    template: `
    <div class="modal-header">
    <h4>Export table(s) to CSV in {{$ctrl.type | lowercase}}</h4>
</div>

<div class="modal-body">
    <p ng-if="$ctrl.type === 'DOCUMENT'">
      This will bring up a popup where you can copy/paste the table contents of this document as CSV, please disable any popup blockers if you don't 
      see the popup. 
      <br/><br/>If you don't see certain content appearing in the popup, please wait until the full document appears in this pane before clicking export.
    </p>
    <p ng-if="$ctrl.type === 'VIEW'">
        This will bring up a popup where you can copy/paste the table contents of this view as CSV, please disable any popup blockers if you don't 
      see the popup. 
      <br/><br/>
      If you don't see certain content appearing in the popup, please wait until the full document appears in this pane before clicking export.
      <!--<br/><br/>If you would like all the tables in the entire document instead, please click on 'GO TO FULL DOCUMENT' and click export again when it finishes loading. -->
    </p>
</div>

<div class="modal-footer">
    <button class="btn btn-primary" ng-click="$ctrl.export()">Export to CSV</button>
    <!--<button ng-if="type == 'VIEW'" class="btn btn-sm btn-primary" ng-click="fulldoc()">GO TO FULL DOCUMENT</button>-->
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>

    
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class TableExportModalController implements angular.IComponentController {
        //bindings
        public modalInstance
        dismiss
        close
        resolve

        //local
        type

        constructor() {}

        $onInit() {
            this.type = this.resolve.type;
        }

        public export() {
            this.close({$value:'export'});
        };

        public cancel() {
            this.dismiss();
        };
    }
}

mmsApp.component(TableExportModalComponent.selector,TableExportModalComponent)