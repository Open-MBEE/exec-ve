import { VePromise } from "@ve-types/angular";
import { AssociationObject, ElementsRequest } from "@ve-types/mms";
import {veUtils} from "@ve-utils";
import { ApiService } from "./Api.service";
import { ElementService } from "./Element.service";

export class AssociationService {
    static $inject = ['ApiService', 'ElementService']
    constructor(private apiSvc: ApiService, private elementSvc: ElementService) {}

    getAssociation<T extends AssociationObject>(
        reqOb: ElementsRequest<string>,
        weight?: number,
        refresh?: boolean,
        allowEmpty?: boolean
    ): VePromise<T> {
        this.apiSvc.normalize(reqOb);
        
    }
}

veUtils.service('AssociationService', AssociationService)