import angular from 'angular';

import { SpecApi } from '@ve-components/spec-tools';
import { ButtonBarApi } from '@ve-core/button-bar';

import { VePromise } from '@ve-types/angular';
import { ElementObject, InstanceValueObject, ValueObject, ViewObject } from '@ve-types/mms';

export interface ComponentController<T = ElementObject> {
    element: T;
    commitId: string;
    edit: T;
    view?: ViewObject;
    instanceSpec?: ElementObject;
    instanceVal?: InstanceValueObject;
    elementSaving: boolean;
    editLoading?: boolean;
    bbApi?: ButtonBarApi;
    editorOptions?: { callback?(e?: JQuery.ClickEvent): VePromise<boolean> };
    specApi?: SpecApi;
    // isEnumeration: boolean,
    skipBroadcast: boolean;
    isEditing: boolean;
    inPreviewMode: boolean;
    values?: ValueObject[];
    editValues?: ValueObject[];
    $scope: angular.IScope;
}
export { InsertApi } from '@ve-types/components/insertions';
export { InsertData } from '@ve-types/components/insertions';
export { InsertResolve } from '@ve-types/components/insertions';
export { InsertResolveFn } from '@ve-types/components/insertions';
