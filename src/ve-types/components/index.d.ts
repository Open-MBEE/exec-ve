import angular from 'angular'

import { SpecApi } from '@ve-components/spec-tools'
import { ButtonBarApi } from '@ve-core/button-bar'

import { EditingApi } from '@ve-types/core/editor'
import {
    ElementObject,
    InstanceValueObject,
    ValueObject,
    ViewObject,
} from '@ve-types/mms'

export interface ComponentController {
    element: ElementObject
    commitId: string
    edit: ElementObject
    view?: ViewObject
    instanceSpec?: ElementObject
    instanceVal?: InstanceValueObject
    elementSaving: boolean
    bbApi?: ButtonBarApi
    editorApi?: EditingApi
    specApi?: SpecApi
    // isEnumeration: boolean,
    skipBroadcast: boolean
    isEditing: boolean
    inPreviewMode: boolean
    editValues?: ValueObject[]
    $scope: angular.IScope
}
export { InsertApi } from '@ve-types/components/insertions'
export { InsertData } from '@ve-types/components/insertions'
export { InsertResolve } from '@ve-types/components/insertions'
export { InsertResolveFn } from '@ve-types/components/insertions'
