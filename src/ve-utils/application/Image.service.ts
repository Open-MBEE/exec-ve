import { AuthService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VeConfig } from '@ve-types/config';

export class ImageService {
    public veConfig: VeConfig = window.__env;

    static $inject = ['AuthService'];

    constructor(private authSvc: AuthService) {}

    public fixImgSrc(imgDom: JQuery<HTMLElement>): void {
        let src = imgDom.attr('src');
        if (src) {
            if (src) {
                if (src.indexOf('http') < 0) {
                    src = this.veConfig.apiUrl + src;
                }
                imgDom.attr('src', src + '?token=' + this.authSvc.getToken());
            }
            if (imgDom.width() < 860) {
                //keep image relative centered with text if less than 9 in
                return;
            }
            const parent = imgDom.parent('p');
            if (parent.length > 0) {
                if (parent.css('text-align') == 'center' || parent.hasClass('image-center')) {
                    imgDom.addClass('image-center');
                }
                imgDom.unwrap(); //note this removes parent p and puts img and any of its siblings in its place
            }
        }
    }

    public fixImgUrl = (src: string, addToken?: boolean): string => {
        const url = new window.URL(src);
        const params = new window.URLSearchParams(url.search);
        if (params.has('token')) {
            params.delete('token');
        }
        if (addToken) {
            params.append('token', this.authSvc.getToken());
        }
        url.search = params.toString();
        return url.toString();
    };
}

veUtils.service('ImageService', ImageService);
