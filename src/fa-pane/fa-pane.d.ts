import * as angular from "angular";
import {FaPaneController} from "./components/fa-pane.component";

declare module 'angular' {
    export namespace pane {
        interface IPaneScope extends angular.IScope {
            subs?: any[];
            $pane?: FaPaneController
            $ctrl?: object
            $parent: IPaneScope
        }
    }
}