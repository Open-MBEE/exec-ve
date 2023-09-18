import { EditService } from '@ve-utils/core';

import { veCore } from '@ve-core';

import { VeQService } from '@ve-types/angular';
import { VeModalService } from '@ve-types/view-editor';

export class EditDialogService {
    static $inject = ['$q', '$uibModal', 'EditService'];
    constructor(private $q: VeQService, private $uibModal: VeModalService, private autosaveSvc: EditService) {}
}

veCore.service('EditDialogService', EditDialogService);
