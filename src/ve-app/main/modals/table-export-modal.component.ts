import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { VeModalController, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

interface TableExportModalResolve extends VeModalResolve {
    type: string;
}

export interface TableExportModalResolveFn extends VeModalResolveFn {
    type(): string;
}

class TableExportModalController extends VeModalControllerImpl<string> implements VeModalController {
    //bindings
    resolve: TableExportModalResolve;
    //local
    type;

    $onInit(): void {
        this.type = this.resolve.type;
    }

    public export(): void {
        this.modalInstance.close('export');
    }

    public cancel(): void {
        this.modalInstance.dismiss();
    }
}

const TableExportModalComponent: VeComponentOptions = {
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
        modalInstance: '<',
        resolve: '<',
    },
    controller: TableExportModalController,
};

veApp.component(TableExportModalComponent.selector, TableExportModalComponent);
