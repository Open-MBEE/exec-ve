import { StateService } from '@uirouter/angularjs'
import { IComponentController } from 'angular'
import Rx from 'rx-lite'

import { RootScopeService } from '@ve-utils/services'

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'
import { ParamsObject } from '@ve-types/mms'

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
    controller: class ShortUrlController implements IComponentController {
        private decodedUrl: ParamsObject
        public subs: Rx.IDisposable[]

        redirect_noResults: boolean = false
        spin: boolean = true

        static $inject = ['$state', 'RootScopeService']

        constructor(
            private $state: StateService,
            private rootScopeSvc: RootScopeService
        ) {}

        $onInit(): void {
            this.rootScopeSvc.veTitle('Redirecting... | View Editor') //what to name this?

            if (this.decodedUrl) {
                if (this.decodedUrl.viewId) {
                    void this.$state.go(
                        'main.project.ref.document.view',
                        this.decodedUrl
                    )
                    return
                }
                if (this.decodedUrl.documentId) {
                    void this.$state.go(
                        'main.project.ref.document',
                        this.decodedUrl
                    )
                    return
                }
                if (this.decodedUrl.refId) {
                    void this.$state.go(
                        'main.project.ref.portal',
                        this.decodedUrl
                    )
                    return
                }
                if (this.decodedUrl.projectId) {
                    void this.$state.go('main.project.refs', this.decodedUrl)
                    return
                }
            } else {
            }
        }

        public resetSelectPage = (): void => {
            void this.$state.go('main.login.select')
        }
    },
}

veApp.component(ShortUrlComponent.selector, ShortUrlComponent)
