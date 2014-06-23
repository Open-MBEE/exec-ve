'use strict';

angular.module('mms.directives')
.directive('mmsNav', ['SiteService', '$templateCache', 'growl', mmsNav]);

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
 * Make any div with an ngModel attached to be a Froala content editable. This
 * requires the Froala library. Transclusion is supported. ngModel is required.
 *
 * @param {string} site The current site name
 * @param {string} title Title to display
 * @param {string} type The type of current page (docweb, product, snapshot, etc)
 */
function mmsNav(SiteService, $templateCache, $log, growl) {
    var template = $templateCache.get('mms/templates/mmsNav.html');

    var mmsNavLink = function(scope, element, attrs) {
        
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
                console.log("closeNavEnd");
                if (e && e.target === this.inner) {
                    window.document.removeEventListener(transition_end, this.closeNavEnd, false);
                }
                this.nav_open = false;
            };

            this.closeNav = function() {
                console.log("closeNav");
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
                console.log("openNav");
                console.log("this.nav_open = " + this.nav_open);
                if (this.nav_open) {
                    return;
                }
                Helper.addClass(doc, this.nav_class); // push the left sidebar right
                this.nav_open = true;
            };

            this.toggleNav = function(e) {
                console.log("toggleNav");
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
                console.log("init");
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

        SiteService.getSites()
        .then(function(data) {
            var sites = {};
            for (var i = 0; i < data.length; i++) {
                var site = data[i];
                if (site.name === scope.site)
                    scope.siteTitle = site.title;
                if (site.categories.length === 0)
                    site.categories.push("Uncategorized");
                for (var j = 0; j < site.categories.length; j++) {
                    var cat = site.categories[j];
                    if (sites.hasOwnProperty(cat)) {
                        sites[cat].push(site);
                    } else {
                        sites[cat] = [site];
                    }
                }
            }
            scope.categories = sites;
        }, function(reason) {
            growl.error("Getting Sites Error: " + reason.message);
        });
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            site: '@', //current site name
            title: '@', //current page title
            type: '@' //current page type
        },
        link: mmsNavLink
    };
}