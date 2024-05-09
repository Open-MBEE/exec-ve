import * as SVG from '@svgdotjs/svg.js';

import { veCoreEvents } from '@ve-core/events';
import { EventService } from '@ve-utils/core';
import { URLService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import { RequestObject } from '@ve-types/mms';

export class SVGService {
    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private uRLSvc: URLService,
        private eventSvc: EventService
    ) {}

    parseSVG(reqOb: RequestObject, url: string): VePromise<SVG.Svg, string> {
        return new this.$q((resolve, reject) => {
            this.$http.get<string>(url).then(
                (result) => {
                    const parse = SVG.SVG().svg(result.data);
                    const svgData = parse.children()[0] as SVG.Svg;
                    svgData.width('100%');
                    svgData.height('100%');
                    //this.svgData.attr('pointer-events', 'bounding-box')
                    svgData
                        .last()
                        .children()
                        .filter((child) => {
                            return child.hasClass('element');
                        })
                        .forEach((child) => {
                            const path = child.first();
                            path.fill('transparent');
                            path.on('click', (e) => {
                                const id: string = child.attr('id') as string;
                                this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', {
                                    elementId: id,
                                    projectId: reqOb.projectId,
                                    refId: reqOb.refId,
                                });
                                e.stopPropagation();
                            });
                        });
                    resolve(svgData);
                },
                (response) => {
                    reject(this.uRLSvc.handleHttpStatus(response));
                }
            );
        });
    }
}

veUtils.service('SVGService', SVGService);
