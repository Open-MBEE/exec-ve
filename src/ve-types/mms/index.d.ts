import { ArtifactObject } from '@ve-types/mms/mms'
import { ValueObject } from '@ve-types/mms/valuesAndInstances'

export * from './valuesAndInstances.d'
export * from './views.d'
export * from './orgsAndProjects.d'
export * from './mms.d'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MmsObject = Record<string, any>

export interface ElementObject extends MmsObject {
    id: string
    _projectId: string
    _refId: string
    _commitId?: string
    _modified?: Date
    _modifier?: string
    _creator?: string
    _created?: Date
    _inRefIds?: string[]
    _artifacts?: ArtifactObject[]
    appliedStereotypeInstanceId?: string
    _appliedStereotypeIds?: string[]
    type?: string
    typeId?: string
    defaultValue?: ValueObject
    documentation?: string
    name?: string
    ownerId?: string
}
