import { ElementService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { AggregationKind, ElementObject, PropertyObject, QueryObject, RequestObject } from '@ve-types/mms';

export type docgenMethod = (context: ElementObject[], reqOb: RequestObject) => VePromise<ElementObject[]>;

export class DocgenService {
    static $inject = ['$q', 'ElementService'];

    constructor(private $q: VeQService, private elementSvc: ElementService) {}

    viewPointMethod(expose: ElementObject[], reqOb: RequestObject, method: docgenMethod[]): VePromise<ElementObject[]> {
        return new this.$q((resolve, reject) => {
            const length = method.length - 1;
            let index = 0;
            const run = (elements: ElementObject[]): void => {
                method[index](elements, reqOb).then((result) => {
                    if (index == length) {
                        resolve(result);
                    } else {
                        index++;
                        run(result);
                    }
                }, reject);
            };

            run(expose);
        });
    }

    collectOwnedElements(recurse?: boolean): docgenMethod {
        return (context: ElementObject[], reqOb: RequestObject) => {
            return this._collectOwnedElements(context, reqOb, recurse);
        };
    }

    collectAssociatedElements(depth: number, kind: AggregationKind): docgenMethod {
        return (context: ElementObject[], reqOb: RequestObject) => {
            return new this.$q((resolve, reject) => {
                const promises: VePromise<{ [id: string]: ElementObject }>[] = [];
                context.forEach((el) => {
                    promises.push(this._collectRecursiveAssociatedElements(el, reqOb, {}, depth, 0, kind));
                });

                const results: { [id: string]: ElementObject } = {};
                this.$q.all(promises).then((values) => {
                    values.forEach((list) => {
                        Object.assign(results, list);
                    });
                    resolve(Object.values(results));
                }, reject);
            });
        };
    }

    filterByStereotypes(stereotypeIds: string[], exclude?: boolean): docgenMethod {
        return (context: ElementObject[], reqOb: RequestObject) => {
            return this._filterByStereotype(context, stereotypeIds, exclude);
        };
    }

    sortByAttribute(sortBy: string, reversed?: boolean): docgenMethod {
        return (context: ElementObject[], reqOb: RequestObject) => {
            return this._sortByAttribute(context, sortBy, reversed);
        };
    }

    removeDuplicates(): docgenMethod {
        return (context: ElementObject[], reqOb) => {
            return this._removeDuplicates(context);
        };
    }

    private _collectRecursiveAssociatedElements(
        context: ElementObject,
        reqOb: RequestObject,
        all: { [id: string]: ElementObject },
        depth: number,
        current: number,
        kind: AggregationKind
    ): VePromise<{ [id: string]: ElementObject }> {
        return new this.$q((resolve, reject) => {
            if (depth != 0 && current > depth) {
                resolve(all);
            }
            const ownedIds: string[] = context.ownedAttributeIds as string[];
            if (ownedIds.length == 0) {
                resolve(all);
            }
            this.elementSvc
                .getElements<PropertyObject>(Object.assign({ elementId: ownedIds }, reqOb), 0)
                .then((owned) => {
                    const promises: VePromise<{ [id: string]: ElementObject }>[] = [];
                    owned.forEach((o) => {
                        if (Object.keys(all).includes(o.id) || o.aggregation != kind) {
                            return;
                        }
                        if (!o.typeId || Object.keys(all).includes(o.typeId)) {
                            return;
                        }
                        this.elementSvc.getElement(Object.assign({ elementId: o.typeId }, reqOb)).then((type) => {
                            all[type.id] = type;
                            promises.push(
                                this._collectRecursiveAssociatedElements(type, reqOb, all, depth, current + 1, kind)
                            );
                        }, reject);
                    });
                    this.$q.all(promises).then(() => {
                        resolve(all);
                    }, reject);
                }, reject);
        });
    }

    private _collectOwnedElements(
        context: ElementObject[],
        reqOb: RequestObject,
        recurse?: boolean
    ): VePromise<ElementObject[]> {
        return new this.$q((resolve, reject) => {
            let query: QueryObject = {};

            if (recurse) {
                query = {
                    params: {
                        id: context[0].id,
                    },
                    recurse: {
                        id: 'ownerId',
                    },
                };
            } else {
                query = {
                    params: {
                        ownerId: context[0].id,
                    },
                };
            }

            this.elementSvc.search<ElementObject>(reqOb, query).then((response) => {
                resolve(response.elements);
            }, reject);
        });
    }

    private _filterByStereotype(
        context: ElementObject[],
        sids: string[],
        exclude?: boolean
    ): VePromise<ElementObject[]> {
        return new this.$q((resolve) => {
            resolve(
                context.filter((e) => {
                    if (e.appliedStereotypeIds) {
                        for (const sid of sids) {
                            if (e.appliedStereotypeIds.indexOf(sid) >= 0) {
                                return !exclude;
                            }
                        }
                    }
                    return exclude;
                })
            );
        });
    }

    private _sortByAttribute(context: ElementObject[], sortBy: string, reversed?: boolean): VePromise<ElementObject[]> {
        return new this.$q((resolve) => {
            context.sort((a, b) => {
                return (a[sortBy] as string).localeCompare(b[sortBy] as string);
            });
            if (reversed) {
                resolve(context.reverse());
            } else {
                resolve(context);
            }
        });
    }

    private _removeDuplicates(context: ElementObject[]): VePromise<ElementObject[]> {
        return new this.$q((resolve) => {
            const result: { [id: string]: ElementObject } = {};
            context.forEach((el) => {
                if (Object.keys(result).includes(el.id)) {
                    return;
                }
                result[el.id] = el;
            });
            resolve(Object.values(result));
        });
    }
}

veUtils.service('DocgenService', DocgenService);
