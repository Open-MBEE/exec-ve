import { VePromise, VeQService } from '@ve-types/angular';
import { ElementObject, ElementsRequest, QueryObject, RequestObject } from '@ve-types/mms';
import { veUtils } from '@ve-utils';
import { ElementService } from '@ve-utils/mms-api-client';

export type docgenMethod = (context: ElementObject[], reqOb: RequestObject) => VePromise<ElementObject[]>

export class DocgenService {

    static $inject = ['$q', 'ElementService']
    
    constructor(private $q:VeQService, private elementSvc: ElementService) {}


    viewPointMethod(expose: ElementObject[], reqOb: RequestObject, method: docgenMethod[]): VePromise<ElementObject[]> {
        return new this.$q((resolve, reject) => {
            const length = method.length - 1;
            let index = 0;
            const run = (elements: ElementObject[]) => {
                method[index](elements,reqOb).then((result) => {
                    if (index == length) {
                        resolve(result)
                    }else {
                        index++
                        run(result)
                    }
                }, reject)
            }

            run(expose);
        })
    }

    collectOwnedElements(recurse?: boolean): docgenMethod {
        return (context: ElementObject[], reqOb: RequestObject) => {
            return this._collectOwnedElements(context,reqOb,recurse)
        }
    }

    filterByStereotypes(stereotypeIds: string[], exclude?: boolean): docgenMethod {
        return (context: ElementObject[], reqOb: RequestObject) => {
            return this._filterByStereotype(context,stereotypeIds, exclude)
        }
    }

    sortByAttribute(sortBy: string, reversed?: boolean): docgenMethod {
        return (context: ElementObject[], reqOb: RequestObject) => {
            return this._sortByAttribute(context,sortBy, reversed)
        }
    }

    private _collectOwnedElements(context: ElementObject[], reqOb: RequestObject, recurse?: boolean): VePromise<ElementObject[]> {
        return new this.$q((resolve,reject) => {
            let query: QueryObject = {}
            
            if (recurse) {
                query = {
                    params: {
                        id: context[0].id
                    },
                    recurse: {
                        id: "ownerId"
                    }
                }
            } else {
                query = {
                    params: {
                        ownerId: context[0].id
                    }
                }
            }
                

            this.elementSvc.search<ElementObject>(reqOb,query).then((response) => {
                resolve(response.elements)
            }, reject)
        })
    }

    private _filterByStereotype(context: ElementObject[], sids: string[], exclude?: boolean): VePromise<ElementObject[]> {
        return new this.$q((resolve) => {
            resolve(context.filter((e) => {
                if (e.appliedStereotypeIds) {
                    
                    for (const sid of sids) {
                        if (e.appliedStereotypeIds.indexOf(sid) >= 0) {
                            return !exclude;
                        }
                    }
                }
                return exclude;
            }))
        })
    }

    private _sortByAttribute(context: ElementObject[], sortBy: string, reversed?: boolean): VePromise<ElementObject[]> {
        return new this.$q((resolve) => {
            context.sort((a,b) => {
                return a[sortBy].localeCompare(b[sortBy]);
            })
            if (reversed) {
                resolve(context.reverse())
            } else {
                resolve(context)
            }
        })
    }
}

veUtils.service('DocgenService', DocgenService)