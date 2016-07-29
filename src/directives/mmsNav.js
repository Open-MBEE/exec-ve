'use strict';

angular.module('mms.directives')
.directive('mmsNav', ['$templateCache', '$state', 'hotkeys', 'growl', '$location', '$uibModal', '$http', 'URLService', 'ApplicationService', 'ElementService','AuthService', mmsNav]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsNav
 *
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * A prebuilt nav bar that's customizable with current page title,
 * and the "type" of page/app. Include navigation to other sites' dashboard
 * and docweb pages.
 * ## Example
 *  <pre>
    <mms-nav mms-title="Model Manager"></mms-nav>
    </pre>
 * ## Support for responsive sliding pane on small browser
 *  <pre>
    <div id="outer-wrap">
        <div id="inner-wrap">
            <mms-nav mms-title="Model Manager"></mms-nav>
            <!-- everything visible on the page should go in here -->
        </div>
    </div>
    </pre>
 * @param {string} mmsTitle Title to display
 */
function mmsNav($templateCache, $state, hotkeys, growl, $location, $uibModal, $http, URLService, ApplicationService, ElementService, AuthService) {
    var template = $templateCache.get('mms/templates/mmsNav.html');

    var mmsNavLink = function(scope, element, attrs) {
        scope.obj = {
            catOpen : false,
            bgColor : {'background-color': 'none'}
        };
        var catNames = [];
        var sites = {};
        scope.toggleHelp = function() {
            hotkeys.toggleCheatSheet();
        };
        scope.toggleAbout = function() {
            scope.veV = '2.3.9';
            scope.mmsV = 'Loading...';
            ApplicationService.getMmsVersion().then(function(data) {
                scope.mmsV = data;
              }, function(reason) {
                scope.mmsV = "Could not retrieve due to failure: " + reason.message;
          	});
            var instance = $uibModal.open({
                templateUrl: 'partials/mms/about.html',
                scope: scope,
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                    $scope.cancel = function() {
                        $uibModalInstance.dismiss();
                    };
                }]
            });
        };
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
        scope.logout = function(){
            AuthService.logout().then(function() {
                $state.go('login');
            }, function(failure) {
                growl.error('You were not logged out');
            });
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

        scope.searchClass = "";
        scope.search = function(searchText) {
            if ($state.includes('workspace.site.document.order')) {
                growl.warning("Please finish reorder action first.");
                return;
            } else if ($state.includes('workspace.diff')) {
                growl.warning("Please finish diff action first.");
                return;
            } else {
                if ($state.params.search === searchText)
                    return;
                scope.searchClass = "fa fa-spin fa-spinner";
                $state.go($state.current.name, {search: searchText});
            }
        };
        scope.stagingView = function(){
            var hostName = $location.host();
            var address = "https://cae-ems-uat.jpl.nasa.gov";
            if (hostName !== 'localhost' && hostName.split('.')[0].substr(-3) !== 'uat')
                address = 'https://' + hostName.split('.')[0] + '-uat.jpl.nasa.gov';
            window.open(address ,'_blank');
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            title: '@mmsTitle', //page title - used in mobile view only
            site: '<mmsSite'
        },
        link: mmsNavLink
    };
}