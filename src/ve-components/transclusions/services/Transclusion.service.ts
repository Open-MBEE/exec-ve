import _ from 'lodash';

import { ApplicationService } from '@ve-utils/application';
import { ViewService } from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { ElementObject, ViewObject } from '@ve-types/mms';

export class TransclusionService {
    static $inject = ['ApplicationService', 'ViewService'];

    constructor(private applicationSvc: ApplicationService, private viewSvc: ViewService) {}

    public createTransclusion = (
        element: ElementObject,
        cfType: string,
        nonEditable?: boolean,
        addProjectandRef?: boolean
    ): string => {
        return `<mms-cf mms-cf-type="${cfType}" mms-element-id="${element.id}"
                  ${addProjectandRef ? ` mms-project-id="${element._projectId}"` : ''}
                  ${addProjectandRef ? ` mms-ref-id="${element._refId}"` : ''}
                  ${addProjectandRef && element._commitId ? ` mms-commit-id="${element._commitId}"` : ''}
                  ${nonEditable ? ' non-editable="true"' : ''}>[cf:${element.name}.${cfType}]</mms-cf>`;
    };

    public createViewLink = (elem: ViewObject, linkType: number, linkText?: string): string => {
        let did: string;
        let vid: string;
        let peid: string;
        const currentDoc = this.applicationSvc.getState().currentDoc;
        if (elem._relatedDocuments && elem._relatedDocuments.length > 0) {
            const cur = _.find(elem._relatedDocuments, {
                id: currentDoc,
            });
            if (cur) {
                did = currentDoc;
                if (cur._parentViews.length > 0) {
                    vid = cur._parentViews[0].id;
                }
            } else {
                did = elem._relatedDocuments[0].id;
                if (elem._relatedDocuments[0]._parentViews.length > 0) {
                    vid = elem._relatedDocuments[0]._parentViews[0].id;
                }
            }
        }
        if (elem.type === 'InstanceSpecification') {
            if (this.viewSvc.isSection(elem)) {
                vid = elem.id;
            } else {
                peid = elem.id;
            }
        } else {
            vid = elem.id;
        }
        return this.getLink(elem, did, vid, peid, linkType, linkText);
    };

    public getLink = (
        elem: ElementObject,
        did: string,
        vid: string,
        peid: string,
        linkType: number,
        linkText?: string
    ): string => {
        let tag = '<mms-view-link';
        if (did) {
            tag += ' mms-doc-id="' + did + '"';
        }
        if (vid) {
            tag += ' mms-element-id="' + vid + '"';
        }
        if (peid) {
            tag += ' mms-pe-id="' + peid + '"';
        }
        if (linkType == 1) {
            tag += ' suppress-numbering="false"';
            tag += ' show-name="false"';
        }
        if (linkType == 2) {
            tag += ' suppress-numbering="true"';
            tag += ' show-name="true"';
        }
        if (linkType == 3 && linkText) {
            tag += ' link-text="' + linkText + '"';
        }
        if (linkType == 4) {
            tag += ' suppress-numbering="false"';
            tag += ' show-name="true"';
        }
        tag += '>[cf:' + elem.name + '.vlink]</mms-view-link>';
        return tag;
    };
}

veComponents.service('TransclusionService', TransclusionService);
