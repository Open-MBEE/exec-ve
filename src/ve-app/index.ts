//Styles
// import '../styles/ve-app/ve-app-main.scss';
// import '../styles/vendor.scss';

//Shared Dependencies
// import 'jquery';

import 'angular';
import 'lodash';
import 'angular-ui-bootstrap';
import 'rx-lite';
import 'flatpickr';

import 'angular-animate';
import 'angular-cookies';
import 'angular-growl-v2';
import 'angular-hotkeys';
import '@uirouter/angularjs';
import 'angular-sanitize';
import 'angular-ui-tree';
import '@openmbee/pane-layout';

import 'angulartics';
import 'angulartics-piwik';

import 'moment';
import 'ngstorage';

import '../lib/angular-promise-extras/angular-promise-extras';
import "../lib/angular-flatpickr/ngFlatpickr.main"
import '../lib/html-rendered-diff/index';

//VE Modules
import "@ve-core"
import "@ve-ext"
import "@ve-utils"

import "./ve-app.module";


import "./main";

import "./login";
import "./pane-center";
import "./pane-left"
import "./pane-right"

export * from "./ve-app.module"

