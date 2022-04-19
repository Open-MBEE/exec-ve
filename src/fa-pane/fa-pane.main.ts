import * as angular from 'angular';
import uiRouter, {TransitionService} from "@uirouter/angularjs";

export const faPane = 'faPane';

export const faPaneModule = angular.module('faPane', [uiRouter])

faPaneModule.config(['$transitionsProvider', function($transitionsProvider: TransitionService) {}]);