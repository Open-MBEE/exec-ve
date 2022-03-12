import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');

let AboutModalComponent: angular.ve.ComponentOptions = {
    selector: "aboutModal",
    template: `
    <div class="modal-header">
    <h4>About</h4>
</div>

<div class="modal-body">
    <p>MMS Version : <b>{{$ctrl.mmsV}}</b></p>
    <p>View Editor Version : <b>{{$ctrl.veV}}</b></p>
</div>

<div class="modal-footer">
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Close</button>
</div>
`,
    bindings: {
        modalInstance: "<",
        resolve: "@"
    },
    controller: class AboutModalController implements angular.IComponentController {

        static $inject = ['$window', 'ApplicationService'];

        private $window
        private applicationSvc

        //bindings
        public modalInstance
        public resolve

        //local
        public veV
        public mmsV

        constructor($window, ApplicationService) {
            this.$window = $window;
            this.applicationSvc = ApplicationService;
        };

        $onInit() {
            this.veV = (this.$window.__env.version) ? this.$window.__env.version : '3.6.1'
            this.mmsV = 'Loading...'

            this.applicationSvc.getMmsVersion().then((data) => {
                this.mmsV = data;
            }, (reason) => {
                this.mmsV = "Could not retrieve due to failure: " + reason.message;
            });

        }

        cancel() {
            this.modalInstance.dismiss();
        }
    }
};

mmsApp.component(AboutModalComponent.selector, AboutModalComponent);