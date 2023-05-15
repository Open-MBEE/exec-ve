import {
    ElementObject,
    MmsObject,
    ExpressionObject,
    InstanceSpecObject,
    InstanceValueObject,
    LiteralObject,
} from '@ve-types/mms';

/* View Objects */
export interface ViewObject extends ElementObject {
    isDoc?: boolean;
    aggregation?: string;
    propertyId?: string;
    _relatedDocuments?: ViewObject[];
    _parentViews?: ViewObject[];
    _contents?: ExpressionObject<InstanceValueObject>;
    _childViews?: ViewObject[];
    _displayedElementIds?: string[];
    _veNumber?: string;
    _printCss?: string;
}

export interface DocumentObject extends ViewObject {
    _groupId?: string;
    _startChapter?: number;
}

export interface PackageObject extends ElementObject {
    elementImportIds?: string[];
    packageImportIds?: string[];
    URI?: string;
    packageMergeIds?: string[];
    profileApplicationIds?: string[];
}

export interface GroupObject extends PackageObject {
    _isGroup?: boolean;
    _parentId?: string;
}

/* View and Presentation Instances */
export interface ViewInstanceSpec extends InstanceSpecObject {
    specification?: ExpressionObject<InstanceValueObject> | LiteralObject<string>;
    _veNumber?: string;
}

export interface PresentationReference extends MmsObject {
    instanceId: string;
    instanceVal?: InstanceValueObject;
    sectionElements: PresentationReference[];
    instanceSpecification?: ViewInstanceSpec;
    presentationElement?: PresentationInstanceObject | ViewInstanceSpec;
    isOpaque: boolean;
}

export interface PresentationInstanceObject extends MmsObject {
    type: string;
    isOpaque?: boolean;
}

export interface PresentContentObject extends PresentationInstanceObject {
    excludeFromList: boolean;
    showIfEmpty: boolean;
    title: string;
}

export interface PresentImageObject extends PresentContentObject {
    id: string;
}

export interface PresentListObject extends PresentContentObject {
    list: PresentationInstanceObject[][];
    ordered?: boolean;
}

export interface PresentTableObject extends PresentContentObject {
    body: TableEntryObject[][];
    header?: TableEntryObject[][];
    colwidths?: string;
    style: string;
}

export interface TableEntryObject {
    colspan: number;
    rowspan: number;
    content: PresentationInstanceObject[];
    startCol?: number;
    endCol?: number;
    startRow?: number;
    endRow?: number;
}

export interface PresentTextObject extends PresentationInstanceObject {
    source: string;
    sourceProperty?: string;
    sourceType: string;
    nonEditable?: boolean;
    text?: string;
}
