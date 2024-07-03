import { ElementObject } from '@ve-types/mms';

export interface ClassObject extends ElementObject {
    ownedAttributes: PropertyObject[];
}

export interface AssociationObject extends ElementObject {
    memberEnds: PropertyObject[];
    ownedEnds: string[];
    navigableOwnedEnds: string[];
}

export interface PropertyObject extends ElementObject {
    propertyType: ElementObject;
    association?: AssociationObject;
    aggregation: AggregationKind;
    upperValue?: string;
    lowerValue?: string;
}

export type AggregationKind = 'composite' | 'shared' | 'none';
