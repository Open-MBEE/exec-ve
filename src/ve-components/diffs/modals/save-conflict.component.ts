import { IComponentController } from 'angular';

import { veComponents } from '@ve-components';

import { VeComponentOptions } from '@ve-types/angular';
import { ElementObject } from '@ve-types/mms';
import { VeModalInstanceService, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface SaveConflictResolve<T extends ElementObject> extends VeModalResolve {
    latest: T;
}
export interface SaveConflictResolveFn<T extends ElementObject> extends VeModalResolveFn {
    latest(): T;
}

class SaveConflictController implements IComponentController {
    //bindings
    private modalInstance: VeModalInstanceService<string>;
    resolve: SaveConflictResolve<ElementObject>;

    //local
    public latest: ElementObject;

    $onInit(): void {
        this.latest = this.resolve.latest;
    }

    ok(): void {
        this.modalInstance.close('ok');
    }

    cancel(): void {
        this.modalInstance.close('cancel');
    }

    force(): void {
        this.modalInstance.close('force');
    }

    merge(): void {
        this.modalInstance.close('merge');
    }
}

const SaveConflictComponent: VeComponentOptions = {
    selector: 'saveConflict',
    template: `
    <div class="modal-header"><h4>Conflict!</h4></div>
<div class="modal-body">
    <p>This element has been updated on the server since the last read
        and your save is rejected!</p>
    <hr/>
    <h6>Latest</h6>
    <spec mms-type="element" mms-element="$ctrl.latest" no-edit="true"></spec>
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
        resolve: '@',
        modalInstance: '<',
    },
    controller: SaveConflictController,
};

veComponents.component(SaveConflictComponent.selector, SaveConflictComponent);
