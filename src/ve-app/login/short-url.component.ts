import { StateService } from '@uirouter/angularjs';
import { IComponentController } from 'angular';
import Rx from 'rx-lite';

import { RootScopeService, ShortUrlService } from '@ve-utils/application';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { ParamsObject } from '@ve-types/mms';

const ShortUrlComponent: VeComponentOptions = {
    selector: 'shortUrl',
    template: `
    <div id="ve-origin-select" class="row">
    <div class="account-wall-lg">
        <div ng-if="$ctrl.spin">
            <h4><i class="fa fa-spinner fa-spin" aria-hidden="true"></i> We are searching. You will be redirected shortly</h4>
        </div>
        <div ng-if="$ctrl.redirect_noResults">
            <h2>This link is not valid</h2>
            <h4>If you believe your content was not moved or deleted, please navigate to it in View Editor and rebookmark.</h4>
            <button style="margin-top:60px;" class="btn btn-primary" ng-click="$ctrl.resetSelectPage()">View Editor Home</button>
        </div>
    </div>
</div>
`,
    bindings: {
        paramsOb: '<',
    },
    controller: class ShortUrlController implements IComponentController {
        private paramsOb: ParamsObject;
        public subs: Rx.IDisposable[];

        decodedUrl: ParamsObject;
        redirect_noResults: boolean = false;
        spin: boolean = true;
        error: string = '';

        static $inject = ['$state', 'growl', 'ShortUrlService', 'RootScopeService'];

        constructor(
            private $state: StateService,
            private growl: angular.growl.IGrowlService,
            private shortUrlSvc: ShortUrlService,
            private rootScopeSvc: RootScopeService
        ) {}

        $onInit(): void {
            this.rootScopeSvc.veTitle('Redirecting... | View Editor'); //what to name this?
            if (this.paramsOb && this.paramsOb.shortUrl) {
                this.shortUrlSvc.decodeShortUrl(this.paramsOb.shortUrl).then(
                    (result) => {
                        this.decodedUrl = result;
                        if (this.decodedUrl.viewId) {
                            void this.$state.go('main.project.ref.view.present', this.decodedUrl);
                            return;
                        }
                        if (this.decodedUrl.documentId) {
                            void this.$state.go('main.project.ref.view.present', this.decodedUrl);
                            return;
                        }
                        if (this.decodedUrl.refId) {
                            void this.$state.go('main.project.ref.portal', this.decodedUrl);
                            return;
                        }
                        if (this.decodedUrl.projectId) {
                            void this.$state.go('main.project.refs', this.decodedUrl);
                            return;
                        }
                    },
                    (reason) => {
                        this.spin = false;
                        this.redirect_noResults = true;
                        this.growl.error(reason.message);
                    }
                );
            } else {
                this.spin = false;
                this.redirect_noResults = true;
                this.growl.error('No short URL found.');
            }
        }

        public resetSelectPage = (): void => {
            void this.$state.go('main.login.select');
        };
    },
};

veApp.component(ShortUrlComponent.selector, ShortUrlComponent);
