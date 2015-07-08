'use strict';

angular.module('mms.directives')
.directive('mmsNav', ['SiteService', 'WorkspaceService', 'ConfigService', '$templateCache', 'growl', mmsNav]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsNav
 *
 * @requires mms.SiteService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * A prebuilt nav bar that's customizable with current page title, current site,
 * and the "type" of page/app. Include navigation to other sites' dashboard
 * and docweb pages.
 * ## Example
 *  <pre>
    <mms-nav mms-title="Model Manager" mms-ws="master" mms-config="tag" mms-site="europa"></mms-nav>
    </pre>
 * ## Support for responsive sliding pane on small browser
 *  <pre>
    <div id="outer-wrap">
        <div id="inner-wrap">
            <mms-nav mms-title="Model Manager" mms-ws="master" mms-config="tag" mms-site="europa"></mms-nav>
            <!-- everything visible on the page should go in here -->
        </div>
    </div>
    </pre>
 * @param {string} mmsWs workspace name
 * @param {object} mmsSite site object
 * @param {object} mmsDoc document object
 * @param {object} mmsConfig tag/config object
 * @param {string} mmsTitle Title to display
 */
function mmsNav(SiteService, WorkspaceService, ConfigService, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsNav.html');

    var mmsNavLink = function(scope, element, attrs) {
        scope.obj = {
            catOpen : false,
            bgColor : {'background-color': 'none'}
        };
        var catNames = [];
        var sites = {};
        
        //Resets catagory and sites accordions
        scope.reset = function(){
            for(var i = 0; i < catNames.length; i++){
                var str = catNames[i];
                scope.categories[str].open = false;
                for(var k = 0; k < scope.categories[str].length; k++){
                    scope.categories[str][k].isOpen = false;
                }
            }
        };
        // Define a few helper functions
        var Helper = {
            trim: function(str) {
                return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
            },
            hasClass: function(el, cn) {
                return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
            },
            addClass: function(el, cn) {
                if (!this.hasClass(el, cn)) {
                    el.className = (el.className === '') ? cn : el.className + ' ' + cn;
                }
            },
            removeClass: function(el, cn) {
                el.className = this.trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
            },
            hasParent: function(el, id) {
                if (el) {
                    do {
                        if (el.id === id) {
                            return true;
                        }
                        if (el.nodeType === 9) {
                            break;
                        }
                    }
                    while((el = el.parentNode));
                }
                return false;
            }
        };

        // Normalize vendor prefixes
        var doc = window.document.documentElement;
        var Modernizr = window.Modernizr;
        var transform_prop = Modernizr.prefixed('transform');
        var transition_prop = Modernizr.prefixed('transition');
        var transition_end = (function() {
                var props = {
                    'WebkitTransition' : 'webkitTransitionEnd',
                    'MozTransition'    : 'transitionend',
                    'OTransition'      : 'oTransitionEnd otransitionend',
                    'msTransition'     : 'MSTransitionEnd',
                    'transition'       : 'transitionend'
                };
                return props.hasOwnProperty(transition_prop) ? props[transition_prop] : false;
            })();

        function Nav() {
            this._init = false;
            this.inner = angular.element('#inner-wrap');
            this.nav_open = false;
            this.nav_class = 'js-nav';

            this.closeNavEnd = function(e) {
                if (e && e.target === this.inner) {
                    window.document.removeEventListener(transition_end, this.closeNavEnd, false);
                }
                this.nav_open = false;
            };

            this.closeNav = function() {
                if (this.nav_open) {
                    // close navigation after transition or immediately
                    var duration = 0;

                    if (transition_end && transition_prop) {
                        duration = 0.5;
                    }

                    this.closeNavEnd(null);

                    // if (duration > 0) {
                    //     window.document.addEventListener(transition_end, this.closeNavEnd, false);
                    // } else {
                    //     this.closeNavEnd(null);
                    // }
                }
                Helper.removeClass(doc, this.nav_class);
            };

            this.openNav = function() {
                if (this.nav_open) {
                    return;
                }
                Helper.addClass(doc, this.nav_class); // push the left sidebar right
                this.nav_open = true;
            };

            this.toggleNav = function(e) {
                if (this.nav_open && Helper.hasClass(doc, this.nav_class)) {
                    this.closeNav();
                } else {
                    this.openNav();
                }
                if (e) {
                    e.preventDefault();
                }
            };

            this.init = function() {
                if (this._init) {
                    return;
                }
                this._init = true;

                // close nav by touching the partial off-screen content
                window.document.addEventListener('click', function(e) {
                    if (this.nav_open && !Helper.hasParent(e.target, 'nav')) {
                        e.preventDefault();
                        this.closeNav();
                    }
                },
                true);

                Helper.addClass(doc, 'js-ready');
            };
        }

        scope.nav = new Nav();
        scope.nav.init();

        WorkspaceService.getWorkspace(scope.ws)
        .then(function(data) {
            scope.wsName = data.name;
        });
        
        /*if (scope.config && scope.config !== '' && scope.config !== 'latest') {
            ConfigService.getConfig(scope.config, scope.ws, false)
            .then(function(data) {
                scope.configName = data.name;
            });
        } else {
            scope.config = 'latest';
        } */

        SiteService.getSites()
        .then(function(data) {
            // var sites = {};
            //var catNames = [];
            for (var i = 0; i < data.length; i++) {
                var site = data[i];
                site.isOpen = true;
                if (site.sysmlid === scope.site)
                    scope.siteTitle = site.name;
                // TODO: Replace with .parent
                site.categories = ["Uncategorized"];
                if (site.categories.length === 0)
                    site.categories.push("Uncategorized");
                for (var j = 0; j < site.categories.length; j++) {
                    var cat = site.categories[j];
                    catNames.push(cat);
                    if (sites.hasOwnProperty(cat)) {
                        sites[cat].push(site);
                    } else {
                        sites[cat] = [site];
                    }
                }
            }
            scope.categories = sites;
            for(var k = 0; k < catNames.length; k++){
                var str = catNames[k];
                scope.categories[str].open = false;
            }
        }, function(reason) {
            growl.error("Sites Error: " + reason.message);
        });
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            title: '@mmsTitle', //page title - used in mobile view only
            ws: '@mmsWs',
            site: '=mmsSite', //site object
            product: '=mmsDoc', //document object
            config: '=mmsConfig', //config object
            snapshot: '@mmsSnapshotTag', // snapshot titles (before tags - need to be backward compatible), if any
            showTag: '@mmsShowTag'
        },
        link: mmsNavLink
    };
}