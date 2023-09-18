import { ApplicationService } from '@ve-utils/application/Application.service';
import { ElementService, ProjectService, URLService, ViewService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { ParamsObject, ShortUrlRequest } from '@ve-types/mms';

export class ShortUrlService {
    public dynamicPopover: {
        templateUrl: string;
        title: string;
    } = {
        templateUrl: 'shareUrlTemplate.html',
        title: 'Link',
    };

    static $inject = [
        '$q',
        '$http',
        '$location',
        'URLService',
        'ProjectService',
        'ViewService',
        'ElementService',
        'ApplicationService',
    ];

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private $location: angular.ILocationService,
        private uRLSvc: URLService,
        private projectSvc: ProjectService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private applicationSvc: ApplicationService
    ) {}

    decodeShortUrl(urlFragment: string): VePromise<ParamsObject, void> {
        const deferred = this.$q.defer<ParamsObject>();
        const urlParts: string[] = urlFragment.split('-');

        const _urlError = (defer?: angular.IDeferred<void>): void => {
            if (defer) defer.reject();
            else deferred.reject('Error Decoding URL');
        };
        const result: ParamsObject = {
            projectId: urlParts[1],
            refId: urlParts[2],
            documentId: urlParts[3] && urlParts[3] === 'cover' ? null : urlParts[3],
            viewId: urlParts[4],
        };
        let orgId: string = urlParts[0];
        const promises: VePromise<void, unknown>[] = [];
        // eslint-disable-next-line prefer-const

        if (orgId) {
            const deferOrg = this.$q.defer<void>();
            promises.push(deferOrg.promise);
            this.projectSvc.getOrgs().then(
                (data) => {
                    const org = data.filter((o) => {
                        return o.id.endsWith(orgId);
                    });
                    if (org.length > 0) {
                        orgId = org[0].id;
                        deferOrg.resolve();
                    } else {
                        _urlError(deferOrg);
                    }
                },
                () => {
                    _urlError(deferOrg);
                }
            );
            if (result.projectId) {
                const deferProj = this.$q.defer<void>();
                promises.push(deferProj.promise);
                deferOrg.promise.then(
                    () => {
                        this.projectSvc.getProjects(orgId).then(
                            (data) => {
                                const proj = data.filter((p) => {
                                    return p.id.endsWith(result.projectId);
                                });
                                if (proj.length > 0) {
                                    result.projectId = proj[0].id;
                                    deferProj.resolve();
                                } else {
                                    _urlError(deferProj);
                                }
                            },
                            () => {
                                _urlError(deferProj);
                            }
                        );
                    },
                    () => {
                        _urlError(deferProj);
                    }
                );
                if (result.refId) {
                    const deferRef = this.$q.defer<void>();
                    promises.push(deferRef.promise);
                    deferProj.promise.then(
                        () => {
                            this.projectSvc.getRefs(result.projectId).then(
                                (data) => {
                                    const refOb = data.filter((r) => {
                                        return result.refId === 'm' ? r.id === 'master' : r.id.endsWith(result.refId);
                                    });
                                    if (refOb.length > 0) {
                                        result.refId = refOb[0].id;
                                        deferRef.resolve();
                                    } else {
                                        _urlError(deferRef);
                                    }
                                },
                                () => {
                                    _urlError(deferRef);
                                }
                            );
                        },
                        () => {
                            _urlError(deferRef);
                        }
                    );
                    if (result.documentId) {
                        if (result.viewId && result.viewId === 'cover') {
                            result.documentId = result.documentId + '_cover';
                        }
                        const deferDoc = this.$q.defer<void>();
                        promises.push(deferDoc.promise);
                        deferRef.promise.then(
                            () => {
                                this.viewSvc
                                    .getProjectDocuments({
                                        projectId: result.projectId,
                                        refId: result.refId,
                                    })
                                    .then(
                                        (data) => {
                                            const doc = data.filter((d) => {
                                                return d.id.endsWith(result.documentId);
                                            });
                                            if (doc.length > 0) {
                                                result.documentId = doc[0].id;
                                                deferDoc.resolve();
                                            } else {
                                                _urlError(deferDoc);
                                            }
                                        },
                                        () => {
                                            _urlError(deferDoc);
                                        }
                                    );
                            },
                            () => {
                                _urlError(deferDoc);
                            }
                        );
                        if (result.viewId && result.viewId !== 'cover') {
                            const deferView = this.$q.defer<void>();
                            promises.push(deferView.promise);
                            deferDoc.promise.then(
                                () => {
                                    this.viewSvc
                                        .getAllViews({
                                            projectId: result.projectId,
                                            refId: result.refId,
                                        })
                                        .then(
                                            (data) => {
                                                const view = data.filter((v) => {
                                                    return v.id.endsWith(result.viewId);
                                                });
                                                if (view.length > 0) {
                                                    result.viewId = view[0].id;
                                                    deferView.resolve();
                                                } else {
                                                    _urlError(deferView);
                                                }
                                            },
                                            () => {
                                                _urlError(deferView);
                                            }
                                        );
                                },
                                () => {
                                    _urlError(deferView);
                                }
                            );
                        }
                    }
                }
            }
            this.$q.all(promises).then(
                () => deferred.resolve(result),
                () => {
                    _urlError();
                }
            );
        } else {
            _urlError();
        }
        return deferred.promise;
    }

    public getShortUrl = (paramOb: ShortUrlRequest): string => {
        const ids: string[] = [];
        const sOId = paramOb.orgId.split(/[-_]+/);
        ids.push(sOId[sOId.length - 1]);
        if (paramOb.projectId && paramOb.projectId !== '') {
            const sPId = paramOb.projectId.split(/[-_]+/);
            ids.push(sPId[sPId.length - 1]);
            if (paramOb.refId && paramOb.refId !== '') {
                if (paramOb.refId === 'master') {
                    ids.push('m');
                } else {
                    const sRId = paramOb.refId.split(/[-_]+/);
                    ids.push(sRId[sRId.length - 1]);
                }
                if (paramOb.documentId && paramOb.documentId !== '') {
                    const sDId = paramOb.documentId.split(/[-_]+/);
                    if (paramOb.documentId.endsWith('_cover')) {
                        if (paramOb.documentId.startsWith('site_')) {
                            ids.push(sDId[sDId.length - 2]);
                        }
                        ids.push('cover');
                    } else {
                        ids.push(sDId[sDId.length - 1]);
                    }
                    if (paramOb.viewId && paramOb.documentId !== '') {
                        const sVId = paramOb.viewId.split(/[-_]+/);
                        ids.push(sVId[sVId.length - 1]);
                    }
                }
            }
        }

        const rootUrl = this.$location.absUrl().split('#')[0];
        let fragment = ids.join('-');
        fragment = fragment.endsWith('-') ? fragment.substring(0, fragment.length - 1) : fragment;
        return `${rootUrl}#/s/${fragment}`;
    };

    public copyToClipboard(target: JQuery<HTMLElement>, $event: JQuery.ClickEvent): VePromise<void, unknown> {
        const shortUrlEl = target.find('#ve-short-url');
        return this.applicationSvc.copyToClipboard(shortUrlEl, $event);
    }
}

veUtils.service('ShortUrlService', ShortUrlService);
