import { ElementObject, ExpressionObject, PackageObject, ValueObject } from '@ve-types/mms';

export class Element implements ElementObject {
    id: string = '';
    _projectId: string = '';
    _refId: string = '';
    appliedStereotypeIds: string[] = [];
    documentation: string = '';
    mdExtensionsIds: string[] = [];
    syncElementId: string = null;
    type: string = 'Element';

    constructor(elementOb?: ElementObject) {
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}
export class NamedElement extends Element {
    name: string = '';
    nameExpression: string = null;
    clientDependencyIds: string[] = [];
    supplierDependencyIds: string[] = [];
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

class PackageableElement extends NamedElement {
    ownerId: string = null;
    visibility: string = 'public';
    templateParameterId: string = null;
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

class TypedElement extends PackageableElement {
    typeId: string = null;
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

class TemplateableElement extends PackageableElement {
    templateBindingIds: string[] = [];
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

export class Property extends TypedElement {
    type = 'Property';
    defaultValue: any[] = [];
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

export class Class extends TemplateableElement {
    classifierBehaviorId: string = null;
    collaborationUseIds: string[] = [];
    elementImportIds: string[] = [];
    generalizationIds: string[] = [];
    classRealizationIds: string[] = [];
    isAbstract: boolean = false;
    isActive: boolean = false;
    isFinalSpecialization: boolean = false;
    isLeaf: boolean = false;
    ownedAttributeIds: string[] = [];
    ownedOperationIds: string[] = [];
    packageImportIds: string[] = [];
    powertypeExtentIds: string[] = [];
    redefinedClassifierIds: string[] = [];
    representationI: string[] = [];
    type = 'Class';
    useCaseIds: string[] = [];
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}
export class InstanceSpec extends PackageableElement {
    classifierIds: string[] = [];
    deploymentIds: string[] = [];
    slotIds: string[] = [];
    specification: Element = null;
    stereotypedElementId: string = null;
    type = 'InstanceSpecification';
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

export class ValueSpec extends TypedElement implements ValueObject {
    valueExpression: string = '';
    type = 'ValueSpecification';
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

export class Expression<T extends ElementObject> extends ValueSpec implements ExpressionObject<T> {
    operand: T[] = [];
    type = 'Expression';
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}

export class Package extends TemplateableElement implements PackageObject {
    type = 'Package';
    visibility = null;
    elementImportIds: string[] = [];
    packageImportIds: string[] = [];
    URI: string = '';
    packageMergeIds: string[] = [];
    profileApplicationIds: string[] = [];
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}
export class Generalization extends Element {
    generalizationSetIds: string[] = [];
    isSubstitutable: boolean = true;
    type = 'Generalization';
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}
export class Dependency extends PackageableElement {
    type = 'Dependency';
    visibility = null;
    constructor(elementOb?: ElementObject) {
        super(elementOb);
        if (elementOb) {
            Object.assign(this, elementOb);
        }
    }
}
