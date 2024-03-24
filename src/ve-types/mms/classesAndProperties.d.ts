import { ElementObject } from '@ve-types/mms';

export interface AssociationObject extends ElementObject {
    memberEnds: PropertyObject[]
    ownedEnds: string[]
    navigableOwnedEnds: string[]
}

export interface PropertyObject extends ElementObject {
    propertyType: ElementObject
    association?: AssociationObject
    aggregation: "composite" | "shared" | "none"
    upperValue?: string
    lowerValue?: string
}