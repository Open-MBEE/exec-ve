import angular from 'angular'

import {
    ElementService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'

import { veUtils } from '@ve-utils'

import { UtilsService } from './Utils.service'

import { VeQService } from '@ve-types/angular'
import { ParamsObject, ShortUrlRequest } from '@ve-types/mms'

export class ShortenUrlService {
    public dynamicPopover: {
        templateUrl: 'shareUrlTemplate.html'
        title: 'Link'
    }

    static $inject = [
        '$http',
        '$q',
        'URLService',
        'ProjectService',
        'ViewService',
        'ElementService',
        'UtilsService',
    ]

    constructor(
        private $http,
        private $q: VeQService,
        private uRLSvc: URLService,
        private projectSvc: ProjectService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private utilsSvc: UtilsService
    ) {}

    decodeShortUrl(url: string): angular.IPromise<ParamsObject> {
        const deferred = this.$q.defer<ParamsObject>()
        const urlParts: string[] = url.split('-')

        const _urlError = (): void => {
            deferred.reject('Error Decoding URL')
        }
        const result: ParamsObject = {}
        let project: angular.IPromise<unknown>,
            ref: angular.IPromise<unknown>,
            document: angular.IPromise<unknown>,
            view: angular.IPromise<unknown>
        // eslint-disable-next-line prefer-const
        if (urlParts.length == 0) {
            return null
        } else {
            project = this.projectSvc.getProjects().then(
                (data) => {
                    const proj = data.filter((p) => {
                        return p.id.endsWith(urlParts[0])
                    })
                    if (proj.length > 0) {
                        result.projectId = proj[0].id
                    } else {
                        _urlError()
                        return
                    }
                },
                () => {
                    _urlError()
                }
            )
        }

        if (urlParts.length >= 2) {
            if (urlParts[1] === 'm') {
                result.refId = 'master'
                ref = this.$q.resolve()
            } else {
                ref = project.then(
                    () => {
                        this.projectSvc.getRefs(result.projectId).then(
                            (data) => {
                                const ref = data.filter((r) => {
                                    return r.id.endsWith(urlParts[1])
                                })
                                if (ref.length > 0) {
                                    result.refId = ref[0].id
                                } else {
                                    _urlError()
                                    return
                                }
                            },
                            () => {
                                _urlError()
                            }
                        )
                    },
                    () => {
                        _urlError()
                    }
                )
            }
        }
        if (urlParts.length >= 3) {
            document = ref.then(
                () => {
                    this.viewSvc
                        .getProjectDocuments({
                            projectId: result.projectId,
                            refId: result.refId,
                        })
                        .then(
                            (data) => {
                                const doc = data.filter((d) => {
                                    return d.id.endsWith(urlParts[2])
                                })
                                if (doc.length > 0) {
                                    result.documentId = doc[0].id
                                } else {
                                    _urlError()
                                    return
                                }
                            },
                            () => {
                                _urlError()
                                return
                            }
                        )
                },
                () => {
                    _urlError()
                    return
                }
            )
        }
        if (urlParts.length >= 4) {
            view = document.then(
                () => {
                    this.viewSvc
                        .getAllViews({
                            projectId: result.projectId,
                            refId: result.refId,
                        })
                        .then(
                            (data) => {
                                const views = data.filter((v) => {
                                    return v.id.endsWith(urlParts[3])
                                })
                                if (views.length > 0) {
                                    result.viewId = views[0].id
                                } else {
                                    _urlError()
                                    return
                                }
                            },
                            () => {
                                _urlError()
                                return
                            }
                        )
                },
                () => {
                    _urlError()
                    return
                }
            )
        }
        view.then(
            () => deferred.resolve(result),
            () => {
                _urlError()
                return
            }
        )
    }

    public getShortUrl = (paramOb: ShortUrlRequest): string => {
        const ids: string[] = []
        const sPId = paramOb.projectId.split(/[-_]+/)
        ids.push(sPId[sPId.length - 1])
        if (paramOb.refId === 'master') {
            ids.push('m')
        } else {
            const sRId = paramOb.refId.split(/[-_]+/)
            ids.push(sRId[sRId.length - 1])
        }
        const sDId = paramOb.documentId.split(/[-_]+/)
        ids.push(sDId[sDId.length - 1])
        if (paramOb.viewId) {
            const sVId = paramOb.viewId.split(/[-_]+/)
            ids.push(sVId[sVId.length - 1])
        }
        let result = `${this.uRLSvc.getUrl().toString()}/s/`
        ids.forEach((id) => {
            result += `-${id}`
        })
        return result
    }

    public copyToClipboard($event: JQuery.ClickEvent): void {
        this.utilsSvc.copyToClipboard($('#ve-short-url'), $event)
    }
}

veUtils.service('ShortenUrlService', ShortenUrlService)
