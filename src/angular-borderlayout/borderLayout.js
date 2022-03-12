(function() {
  var module = angular.module("fa.directive.borderLayout", []);

  var faDragged = false; // Fix dragging on toggle

  module.factory("paneManager", function() {
    return {
      panes: {},
      get: function(paneId) {
        return this.panes[paneId];
      },
      set: function(paneId, pane) {
        return this.panes[paneId] = pane;
      },
      remove: function(paneId) {
        return delete this.panes[paneId];
      }
    };
  });

  module.directive("faPane", [
    "$window", "$rootScope", '$timeout', '$interval', "paneManager", function($window, $rootScope, $timeout, $interval, paneManager) {

      var Region = (function() {
        function Region(width, height, top, right, bottom, left) {
          this.width = width != null ? width : 0;
          this.height = height != null ? height : 0;
          this.top = top != null ? top : 0;
          this.right = right != null ? right : 0;
          this.bottom = bottom != null ? bottom : 0;
          this.left = left != null ? left : 0;
        }

        Region.prototype.clone = function() {
          return new Region(this.width, this.height, this.top, this.right, this.bottom, this.left);
        };

        Region.prototype.calculateSize = function(orientation, target) {
          var matches, terms;

          if (target == null) {
            target = 0;
          }

          var total = this.getSize(orientation);
          var available = this.getAvailableSize(orientation);

          if (angular.isNumber(target)) {
            if (target >= 1) {
              return Math.round(target);
            }
            if (target >= 0) {
              return Math.round(target * total);
            }
            return 0;
          }

          // Kill whitespace
          target = target.replace(/\s+/mg, "");

          // Allow for complex sizes, e.g.: 50% - 4px
          if ((terms = target.split("-")).length > 1) {
            return this.calculateSize(orientation, terms.shift()) - this.calculateSize(orientation, terms.join("+"));
          }
          if ((terms = target.split("+")).length > 1) {
            return this.calculateSize(orientation, terms.shift()) + this.calculateSize(orientation, terms.join("+"));
          }

          if (matches = target.match(/^(\d+)(?:px)?$/)) {
            return parseInt(matches[1], 10);
          }
          if (matches = target.match(/^(\d+(?:\.\d+)?)&$/)) {
            return Math.round(available * parseFloat(matches[1]) / 100);
          }
          if (matches = target.match(/^(\d+(?:\.\d+)?)%$/)) {
            return Math.round(total * parseFloat(matches[1]) / 100);
          }

          throw new Error("Unsupported size: " + target);
        };

        Region.prototype.consume = function(anchor, size) {
          var style;

          if (size == null) {
            size = 0;
          }

          switch (anchor) {
            case "north":
              style = {
                top: "" + this.top + "px",
                right: "" + this.right + "px",
                bottom: "auto",
                left: "" + this.left + "px",
                height: "" + size + "px",
                width: "auto"
              };
              this.top += size;
              break;
            case "east":
              style = {
                top: "" + this.top + "px",
                right: "" + this.right + "px",
                bottom: "" + this.bottom + "px",
                left: "auto",
                width: "" + size + "px",
                height: "auto"
              };
              this.right += size;
              break;
            case "south":
              style = {
                top: "auto",
                right: "" + this.right + "px",
                bottom: "" + this.bottom + "px",
                left: "" + this.left + "px",
                height: "" + size + "px",
                width: "auto"
              };
              this.bottom += size;
              break;
            case "west":
              style = {
                top: "" + this.top + "px",
                right: "auto",
                bottom: "" + this.bottom + "px",
                left: "" + this.left + "px",
                width: "" + size + "px",
                height: "auto"
              };
              this.left += size;
          }

          if (size === 0) {
            style.display = "none";
          }

          return style;
        };

        Region.prototype.getInnerRegion = function() {
          return new Region(this.width - this.right - this.left, this.height - this.top - this.bottom);
        };

        Region.prototype.getSize = function(orientation) {
          switch (orientation) {
            case "vertical":
              return this.height;
            case "horizontal":
              return this.width;
          }
        };

        Region.prototype.getAvailableSize = function(orientation) {
          switch (orientation) {
            case "vertical":
              return this.height - this.top - this.bottom;
            case "horizontal":
              return this.width - this.right - this.left;
          }
        };

        Region.prototype.toString = function() {
          return "{" + this.top + ", " + this.right + ", " + this.bottom + ", " +
            this.left + "}, {" + this.width + ", " + this.height + "}";
        };

        return Region;
      })();

      var getOrientation = function(anchor) {
        switch (anchor) {
          case "north":
          case "south":
            return "vertical";
          case "east":
          case "west":
            return "horizontal";
        }
      };

      var getScrollerStyle = function(anchor, size) {
        var style = {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        };

        if (size) {
          switch (anchor) {
            case "north":
              style.bottom = "auto";
              style.height = "" + size + "px";
              break;
            case "east":
              style.left = "auto";
              style.width = "" + size + "px";
              break;
            case "south":
              style.top = "auto";
              style.height = "" + size + "px";
              break;
            case "west":
              style.right = "auto";
              style.width = "" + size + "px";
          }
        }

        return style;
      };

      var getHandleStyle = function(anchor, region, handleSize) {
        switch (anchor) {
          case "north":
            return {
              height: region.calculateSize('vertical', handleSize) + "px",
              right: 0,
              left: 0,
              bottom: 0
            };
          case "south":
            return {
              height: region.calculateSize('vertical', handleSize) + "px",
              right: 0,
              left: 0,
              top: 0
            };
          case "east":
            return {
              width: region.calculateSize('horizontal', handleSize) + "px",
              top: 0,
              bottom: 0,
              left: 0
            };
          case "west":
            return {
              width: region.calculateSize('horizontal', handleSize) + "px",
              top: 0,
              bottom: 0,
              right: 0
            };
        }
      };

      var generateSerialId = (function() {
        var counter = 0;

        var fun = function() {
          return counter++;
        };

        fun.peek = function() {
          return counter;
        };

        return fun;
      })();

      var setupScrollEvent = function(elementWithScrollbar, elementInsideScrollbar, $scope ) {
        // This assignment gives access to this method to the client of the library
        $scope.scrollApi.isScrollVisible = _isScrollbarVisible;
        var thresholdFromScrollbarAndBottom = $scope.scrollApi.threshold || 2000 ;
        var scrollThrottleRate = $scope.scrollApi.throttleRate || 500;
        var frequency = $scope.scrollApi.frequency || 100;
        var waiting = false;
        var intervalHandler;

        elementInsideScrollbar.removeAttr('pane-scroll-api');
        elementWithScrollbar.addEventListener('scroll', _scrollHandler, true);

        function _scrollHandler() {
          if (waiting) {
              return;
          }
          waiting = true;
          // scrolling happens very fast. buffer it using scrollThrottleRate
          $timeout(function() {
            intervalHandler = $interval(function() {
                var totalHeight = elementInsideScrollbar.prop('scrollHeight');
                var hiddenContentHeight = totalHeight - elementInsideScrollbar.height();
                if (_isScrollbarAlmostAtTheBottom(hiddenContentHeight)) {
                    var stopListen = $scope.scrollApi.notifyOnScroll();
                    if (stopListen) {
                        elementWithScrollbar.removeEventListener('scroll', _scrollHandler, true);
                        $interval.cancel(intervalHandler);
                    }
                } else {
                    waiting = false;
                    $interval.cancel(intervalHandler);
                }
            }, frequency);
          }, scrollThrottleRate);
        }

        function _isScrollbarVisible() {
          return elementInsideScrollbar.prop('scrollHeight') > elementInsideScrollbar.height();
        }

        function _isScrollbarAlmostAtTheBottom(hiddenContentHeight) {
          return hiddenContentHeight - elementInsideScrollbar.scrollTop() <= thresholdFromScrollbarAndBottom;
        }
      };

      // BEGIN DIRECTIVE DECLARATION
      return {
        restrict: "A",
        replace: true,
        require: "faPane",
        priority: 1,
        transclude: "element",
        scope: {
          anchor: "@paneAnchor",
          paneId: "@faPane",
          size: "@paneSize",
          min: "@paneMin",
          max: "@paneMax",
          handle: "@paneHandle",
          closed: "=paneClosed",
          order: "@paneOrder",
          noToggle: "@paneNoToggle",
          noScroll: "@paneNoScroll",
          scrollApi: '<paneScrollApi'
        },
        template:
          '<div class="fa-pane pane-{{$pane.id}}">' +
            '<div class="fa-pane-overlay"></div>' +
            '<div class="fa-pane-handle" fa-pane-resizer>' +
              '<div ng-if="!$pane.noToggle" class="fa-pane-toggle" ng-click="$pane.toggle()"></div>' +
            '</div>' +
          '</div>',
        controllerAs: "$pane",
        controller: function() {
          var $pane = this;

          return angular.extend(this, {
            children: [],
            closed: false,
            noToggle: false,
            max: Number.MAX_VALUE,
            min: 0,
            // Schedule a re-flow later in the digest cycle, but do not reflow
            // more than necessary
            $scheduleReflow: function() {
              if ($pane.parent) {
                return $pane.parent.$scheduleReflow();
              } else if (!$pane.$reflowScheduled) {
                $pane.$reflowScheduled = true;

                return $rootScope.$evalAsync(function() {
                  if ($pane.$reflowScheduled) {
                    $pane.reflow();
                  }

                  return $pane.$reflowScheduled = false;
                });
              }
            },
            $onStartResize: function() {
              if ($pane.$parent) {
                return $pane.parent.$containerEl.addClass("fa-pane-resizing");
              } else {
                return $pane.$containerEl.addClass("fa-pane-resizing");
              }
            },
            $onStopResize: function() {
              if ($pane.$parent) {
                return $pane.parent.$containerEl.removeClass("fa-pane-resizing");
              } else {
                return $pane.$containerEl.removeClass("fa-pane-resizing");
              }
            },
            getOptions: function() {
              return {
                anchor: this.anchor,
                targetSize: this.targetSize,
                size: this.size,
                min: this.min,
                max: this.max,
                order: this.order || 0,
                handle: {
                  open: this.handleSizeOpen || 0,
                  closed: this.handleSizeClosed || 0
                },
                noToggle: !!this.noToggle,
                closed: this.closed
              };
            },
            setOptions: function(options) {
              if (options == null) {
                options = {};
              }
              if (options.anchor != null) {
                this.setAnchor(options.anchor);
              }
              if (options.size != null) {
                this.setTargetSize(options.size);
              }
              if (options.min != null) {
                this.setMinSize(options.min);
              }
              if (options.max != null) {
                this.setMaxSize(options.max);
              }
              if (options.handle != null) {
                this.setHandleSize(options.handle);
              }
              if (options.order != null) {
                this.setOrder(options.order);
              }
              if (options.noToggle != null) {
                this.setNoToggle(options.noToggle);
              }
              if (options.closed != null) {
                return this.toggle(!options.closed);
              }
            },
            setAnchor: function(anchor) {
              this.anchor = anchor;

              return this.$scheduleReflow();
            },
            setTargetSize: function(targetSize) {
              this.targetSize = targetSize;

              return this.$scheduleReflow();
            },
            setMinSize: function(min) {
              this.min = min;

              return this.$scheduleReflow();
            },
            setMaxSize: function(max) {
              this.max = max;

              return this.$scheduleReflow();
            },
            setOrder: function(order) {
              this.order = order;

              return this.$scheduleReflow();
            },
            setNoToggle: function(noToggle) {
              this.noToggle = noToggle;

              return this.$scheduleReflow();
            },
            setHandleSize: function(handleSize) {
              if ((handleSize != null ? handleSize.open : void 0) ||
                (handleSize != null ? handleSize.closed : void 0)) {

                this.handleSizeOpen = parseInt(handleSize.open, 10) || 0;
                this.handleSizeClosed = parseInt(handleSize.closed, 10) || 0;
              } else {
                this.handleSizeOpen = this.handleSizeClosed = parseInt(handleSize, 10);
              }

              return this.$scheduleReflow();
            },
            addChild: function(child) {
              child.parent = $pane;
              this.children.push(child);

              if (this.children.length) {
                $pane.$containerEl.addClass("fa-pane-parent");
              }

              return $pane.$scheduleReflow();
            },
            getOrientation: function() {
              return getOrientation($pane.anchor);
            },
            onHandleDown: function() {
              return $pane.$containerEl.addClass("active");
            },
            onHandleUp: function() {
              $pane.$containerEl.removeClass("active");

              return $pane.$scheduleReflow();
            },
            removeChild: function(child) {
              var idx;

              if (!(0 > (idx = this.children.indexOf(child)))) {
                this.children.splice(idx, 1);
              }

              if (!this.children.length) {
                $pane.$containerEl.removeClass("fa-pane-parent");
              }

              return $pane.$scheduleReflow();
            },
            reflow: function(region) {
              var width = $pane.$containerEl[0].offsetWidth;
              var height = $pane.$containerEl[0].offsetHeight;

              region || (region = new Region(width, height));

              var _ref = $pane.anchor;
              if (_ref === "north" || _ref === "east" || _ref === "south" || _ref === "west") {

                $pane.$containerEl.removeClass("fa-pane-orientation-vertical");
                $pane.$containerEl.removeClass("fa-pane-orientation-horizontal");

                var orientation = getOrientation($pane.anchor);

                $pane.$containerEl.addClass("fa-pane-orientation-" + orientation);

                var handleSize = region.calculateSize(orientation, !$pane.closed &&
                $pane.handleSizeOpen || $pane.handleSizeClosed);

                var size = handleSize;
                if (!$pane.closed) {
                  size = region.calculateSize(orientation, !$pane.closed && $pane.targetSize || handleSize);

                  size = Math.min(size, region.calculateSize(orientation, $pane.max));
                  size = Math.max(size, region.calculateSize(orientation, $pane.min));
                  size = Math.min(size, region.getAvailableSize(orientation));
                  size = Math.max(size, handleSize);
                }

                this.size = size;

                var styleContainer = region.consume($pane.anchor, size);
                var styleScroller = getScrollerStyle($pane.anchor, size - handleSize);
                var styleHandle = getHandleStyle($pane.anchor, region, handleSize);

                $pane.$containerEl.attr("style", "").css(styleContainer);
                $pane.$overlayEl.attr("style", "").css(styleScroller);
                $pane.$handleEl.attr("style", "").css(styleHandle);
                $pane.$scrollerEl.attr("style", "").css(styleScroller);

              } else {
                $pane.$containerEl.css({
                  top: region.top + "px",
                  right: region.right + "px",
                  bottom: region.bottom + "px",
                  left: region.left + "px",
                  width: "auto",
                  height: "auto"
                });
              }

              $pane.$region = region.clone();
              $pane.reflowChildren(region.getInnerRegion());

              $rootScope.$broadcast("fa-pane-resize", $pane);
            },
            reflowChildren: function(region) {
              region || (region = $pane.$region);

              $pane.children.sort(function(a, b) {
                return a.order - b.order;
              });

              var results = [];

              for (var i = 0; i < $pane.children.length; i++) {
                var child = $pane.children[i];
                results.push(child.reflow(region));
              }

              return results;
            },
            resize: function(size) {
              if (size == null) {
                size = $pane.targetSize;
              }

              $pane.targetSize = size;
              $pane.parent.reflowChildren($pane.parent.$region.getInnerRegion());

              if (size !== $pane.size) {
                return $pane.$containerEl.addClass("fa-pane-constrained");
              } else {
                return $pane.$containerEl.removeClass("fa-pane-constrained");
              }
            },
            toggle: function(open) {
              // Fix for dragging on toggle
              if (faDragged) {
                faDragged = false;
                return $pane;
              }

              if (open == null) {
                open = !!$pane.closed;
              }

              $pane.closed = !open;

              var reflow = function() {
                if ($pane.parent) {
                  return $pane.parent.$scheduleReflow();
                } else {
                  return $pane.$scheduleReflow();
                }
              };

              if ($pane.closed) {
                $pane.$containerEl.addClass("fa-pane-closed");
              } else {
                $pane.$containerEl.removeClass("fa-pane-closed");
              }

              return reflow();
            }
          });
        },
        compile: function($el, $attrs, $transclude) {
          // Tool used to force elements into their compile order
          var serialId = generateSerialId();

          return function($scope, $el, $attrs, $pane) {
            var $directiveScope = $scope.$parent.$new();
            $directiveScope.$pane = $scope.$pane = $pane;

            var $transcludeScope = $directiveScope.$new();

            if ($pane.order == null) {
              $pane.order = serialId;
            }

            $pane.id = $attrs.faPane;

            $pane.$isolateScope = $scope;
            $pane.$directiveScope = $directiveScope;
            $pane.$transcludeScope = $transcludeScope;

            return $transclude($transcludeScope, function(clone) {
              if ($attrs.paneNoScroll !== 'true') {
                clone.addClass("fa-pane-scroller");
                if ($attrs.paneScrollApi) {
                  setupScrollEvent($el[0], clone, $scope);
                }
              }

              $el.append(clone);

              $pane.$containerEl = $el;
              $pane.$overlayEl = $el.children().eq(0);
              $pane.$handleEl = $el.children().eq(1);
              $pane.$scrollerEl = $el.children().eq(2);

              $scope.$watch("anchor", function(anchor) {
                return $pane.setAnchor(anchor);
              });

              $scope.$watch("size", function(targetSize) {
                return $pane.setTargetSize(targetSize);
              });

              $scope.$watch("closed", function(closed) {
                return $pane.toggle(!closed);
              });

              $scope.$watch("min", function(min) {
                return $pane.setMinSize(min != null ? min : 0);
              });

              $scope.$watch("max", function(max) {
                return $pane.setMaxSize(max != null ? max : Number.MAX_VALUE);
              });

              $scope.$watch("order", function(order) {
                return $pane.setOrder(order);
              });

              $scope.$watch("noToggle", function(noToggle) {
                return $pane.setNoToggle(!!noToggle);
              });

              $scope.$watch("paneId", function(paneId, prevPaneId) {
                if (prevPaneId) {
                  paneManager.remove(prevPaneId);
                }

                paneManager.set(paneId, $pane);

                return $pane.id = paneId;
              });

              $scope.$watch("handle", function(handle) {
                return $pane.setHandleSize(handle);
              });

              $scope.$watch($attrs.paneHandleObj, (function(handle) {
                if (handle) {
                  return $pane.setHandleSize(handle);
                }
              }), true);

              $pane.$directiveScope.$on("fa-pane-attach", function(e, child) {
                if (child !== $pane) {

                 e.stopPropagation();
                  return $pane.addChild(child);
                }
              });

              $pane.$directiveScope.$on("fa-pane-detach", function(e, child) {
                if (child !== $pane) {
                  e.stopPropagation();
                  return $pane.removeChild(child);
                }
              });

              $window.addEventListener("resize", function(e) {
                e.stopPropagation();
                return $pane.$scheduleReflow();
              });

              $pane.$directiveScope.$on("$stateChangeSuccess", function() {
                return $pane.$scheduleReflow();
              });

              $pane.$directiveScope.$emit("fa-pane-attach", $pane);

              return $pane.$directiveScope.$on("$destroy", function() {
                return $pane.$directiveScope.$emit("fa-pane-detach", $pane);
              });
            });
          };
        }
      };
    }
  ]);

  module.directive("faPaneToggle", [
    "paneManager", function(paneManager) {
      return {
        link: function($scope, $el, $attrs) {
          return $attrs.$observe("faPaneToggle", function(paneId) {});
        }
      };
    }
  ]);

  module.directive("faPaneResizer", [
    "$window", function($window) {

      var throttle = function(delay, fn) {
        var throttled = false;

        return function() {
          if (throttled) {
            return;
          }
          throttled = true;

          setTimeout(function() {
            return throttled = false;
          }, delay);

          return fn.call.apply(fn, [this].concat([].slice.call(arguments)));
        };
      };

      return {
        restrict: "A",
        //require: "^faPane",
        link: function($scope, $element, $attrs, $pane) {
          // return unless $pane
          $pane || ($pane = $scope.$pane);

          var el = $element[0];

          var clickRadius = 5;
          var clickTime = 300;

          $scope.$watch((function() {
            return $pane.getOrientation();
          }), function(orientation) {
            $element.removeClass("vertical");
            $element.removeClass("horizontal");

            switch (orientation) {
              case "vertical":
                return $element.addClass("vertical");
              case "horizontal":
                return $element.addClass("horizontal");
            }
          });

          return el.addEventListener("mousedown", function(e) {
            if (e.button !== 0) {
              return;
            }

            var anchor = $pane.anchor;
            var coord;
            if (anchor === "north" || anchor === "south") {
              coord = "screenY";
            } else if (anchor === "west" || anchor === "east") {
              coord = "screenX";
            }

            var scale;
            if (anchor === "north" || anchor === "west") {
              scale = 1;
            } else if (anchor === "south" || anchor === "east") {
              scale = -1;
            }

            var startPos = {
              x: e.screenX,
              y: e.screenY
            };
            var startCoord = e[coord];
            var startSize = $pane.size;
            var startTime = Date.now();

            //pane.onHandleDown();

            // Not sure if this really adds value, but added for compatibility
            el.unselectable = "on";
            el.onselectstart = function() {
              return false;
            };
            el.style.userSelect = el.style.MozUserSelect = "none";

            // Null out the event to re-use e and prevent memory leaks
            //e.setCapture();
            e.preventDefault();
            e.defaultPrevented = true;
            e = null;

            var handleMouseMove = function(e) {
              faDragged = true; // Fix for dragging on toggle

              $pane.$onStartResize();

              // Inside Angular's digest, determine the ideal size of the element
              // according to movements then determine if those movements have been
              // constrained by boundaries, other panes or min/max clauses
              $scope.$apply(function() {
                var targetSize = startSize + scale * (e[coord] - startCoord);

                return $pane.resize(targetSize);
              });

              // Null out the event in case of memory leaks
              //e.setCapture();
              e.preventDefault();
              e.defaultPrevented = true;
              return e = null;
            };

            var handleMouseUp;
            handleMouseUp = function(e) {
              var displacementSq = Math.pow(e.screenX - startPos.x, 2) +
                                   Math.pow(e.screenY - startPos.y, 2);
              var timeElapsed = Date.now() - startTime;

              $window.removeEventListener("mousemove", handleMouseMoveThrottled, true);
              $window.removeEventListener("mouseup", handleMouseUp, true);

              var cleanup = function() {
                $pane.$onStopResize();

                // Null out the event in case of memory leaks
                //e.releaseCapture();
                e.preventDefault();
                e.defaultPrevented = true;
                return e = null;
              };

              if (displacementSq <= Math.pow(clickRadius, 2) && timeElapsed <= clickTime) {
                cleanup();
                return;
              }

              // In case the mouse is released at the end of a throttle period
              handleMouseMove(e);

              return cleanup();
            };

            // Prevent the reflow logic from happening too often
            var handleMouseMoveThrottled = throttle(10, handleMouseMove);

            $window.addEventListener("mouseup", handleMouseUp, true);
            return $window.addEventListener("mousemove", handleMouseMoveThrottled, true);
          });
        }
      };
    }
  ]);

}).call(this);
