import * as angular from 'angular';
import { TransitionService } from '@uirouter/angularjs';
import {EventService} from "../../mms/services/EventService.service";
import {PaneService} from "../../mms/services/PaneManager.service";

var mmsApp = angular.module('mmsApp');

var faDragged = false; // Fix dragging on toggle

class Region {

    public rWidth
    rHeight
    rTop
    rRight
    rBottom
    rLeft

    constructor(rWidth?: number, rHeight?: number, rTop?: number, rRight?: number, rBottom?: number, rLeft?: number) {
        this.rWidth = rWidth != null ? rWidth : 0;
        this.rHeight = rHeight != null ? rHeight : 0;
        this.rTop = rTop != null ? rTop : 0;
        this.rRight = rRight != null ? rRight : 0;
        this.rBottom = rBottom != null ? rBottom : 0;
        this.rLeft = rLeft != null ? rLeft : 0;
    }

    clone() {
        return new Region(this.rWidth, this.rHeight, this.rTop, this.rRight, this.rBottom, this.rLeft);
    };

    calculateSize(orientation, target) {
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

        if ((matches = target.match(/^(\d+)(?:px)?$/)) != null) {
            return parseInt(matches[1], 10);
        }
        if ((matches = target.match(/^(\d+(?:\.\d+)?)&$/)) != null) {
            return Math.round(available * parseFloat(matches[1]) / 100);
        }
        if ((matches = target.match(/^(\d+(?:\.\d+)?)%$/)) != null) {
            return Math.round(total * parseFloat(matches[1]) / 100);
        }

        throw new Error("Unsupported size: " + target);
    };

    consume(anchor, size) {
        var style;

        if (size == null) {
            size = 0;
        }

        switch (anchor) {
            case "north":
                style = {
                    top: "" + this.rTop + "px",
                    right: "" + this.rRight + "px",
                    bottom: "auto",
                    left: "" + this.rLeft + "px",
                    height: "" + size + "px",
                    width: "auto"
                };
                this.rTop += size;
                break;
            case "east":
                style = {
                    top: "" + this.rTop + "px",
                    right: "" + this.rRight + "px",
                    bottom: "" + this.rBottom + "px",
                    left: "auto",
                    width: "" + size + "px",
                    height: "auto"
                };
                this.rRight += size;
                break;
            case "south":
                style = {
                    top: "auto",
                    right: "" + this.rRight + "px",
                    bottom: "" + this.rBottom + "px",
                    left: "" + this.rLeft + "px",
                    height: "" + size + "px",
                    width: "auto"
                };
                this.rBottom += size;
                break;
            case "west":
                style = {
                    top: "" + this.rTop + "px",
                    right: "auto",
                    bottom: "" + this.rBottom + "px",
                    left: "" + this.rLeft + "px",
                    width: "" + size + "px",
                    height: "auto"
                };
                this.rLeft += size;
        }

        if (size === 0) {
            style.display = "none";
        }

        return style;
    };

    getInnerRegion() {
        return new Region(this.rWidth - this.rRight - this.rLeft, this.rHeight - this.rTop - this.rBottom);
    };

    getSize(orientation) {
        switch (orientation) {
            case "vertical":
                return this.rHeight;
            case "horizontal":
                return this.rWidth;
        }
    };

    getAvailableSize(orientation) {
        switch (orientation) {
            case "vertical":
                return this.rHeight - this.rTop - this.rBottom;
            case "horizontal":
                return this.rWidth - this.rRight - this.rLeft;
        }
    };

    toString() {
        return "{" + this.rTop + ", " + this.rRight + ", " + this.rBottom + ", " +
            this.rLeft + "}, {" + this.rWidth + ", " + this.rHeight + "}";
    };

}

const getOrientation = (anchor) => {
    switch (anchor) {
        case "north":
        case "south":
            return "vertical";
        case "east":
        case "west":
            return "horizontal";
    }
};

const getScrollerStyle = (anchor, size) => {
    let style = {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
        height: null,
        width: null
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

const getHandleStyle = (anchor, region, handleSize) => {
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

var generateSerialId = (() => {
    let counter = 0;

    return () => {
        return {
            counter: counter++,
            peek: () => {
                return counter;
            }
        };
    };
})();

let PaneComponent: angular.ve.ComponentOptions = {
    selector: "faPane",
    bindings: {
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
    template: `
    <div class="fa-pane pane-{{$pane.id}}">
        <div class="fa-pane-overlay"></div>
        <div class="fa-pane-handle" fa-pane-resizer>
            <div ng-if="!$pane.noToggle" class="fa-pane-toggle" ng-click="$pane.toggle()"></div>
        </div>
</div>
`,
    controllerAs: "$pane",
    transclude: true,
    controller: class FaPaneController implements angular.IComponentController {

        static $inject = ['$window', '$scope', '$transitions', '$timeout', '$transclude', '$interval', '$element', '$attrs',
            'PaneService', 'EventService'];


        //Injected
         private readonly $evalAsync
                 subs


        //Bindings
        public anchor
                paneId
                size
                min
                max
                handle
                closed
                order
                noToggle
                noScroll
                scrollApi
                id


        //Locals
        public parent
                children
                $reflowScheduled
                $transcludeScope
                $containerEl
                $overlayEl
                $handleEl
                $scrollerEl
                targetSize
                $parent
                handleSizeOpen
                handleSizeClosed
                $region


        constructor(private $window, private $scope: angular.IScope, private $transitions: TransitionService,
                    private $timeout: angular.ITimeoutService, private $transclude: angular.ITranscludeFunction,
                    private $interval: angular.IIntervalService, private $element: angular.IRootElementService,
                    private $attrs: angular.IAttributes, private paneSvc: PaneService, private eventSvc: EventService) {
            this.$evalAsync = this.$scope.$evalAsync;

            this.children = [];
            this.closed = (this.closed) ? this.closed : false;
            this.noToggle = false;
            this.max = Number.MAX_VALUE;
            this.min = 0
            if (this.parent) {
                return this.parent.$scheduleReflow();
            } else if (!this.$reflowScheduled) {
                this.$reflowScheduled = true;

                return this.$evalAsync(() => {
                    if (this.$reflowScheduled) {
                        this.reflow();
                    }

                    return this.$reflowScheduled = false;
                });
            }

        }

        $onInit() {
             this.eventSvc.$init(this);
        }

        $onChanges(changes) {
            if (changes.anchor){
                this.setAnchor(this.anchor);
            }

            if (changes.size) {
                this.setTargetSize(this.size);
            }

            if (changes.closed) {
                this.toggle(!this.closed);
            }

            if (changes.min) {
                this.setMinSize(this.min != null ? this.min : 0);
            }

            if (changes.max) {
                this.setMaxSize(this.max != null ? this.max : Number.MAX_VALUE);
            }

            if (changes.order) {
                this.setOrder(this.order);
            }

           if (changes.noToggle) {
               this.setNoToggle(!!this.noToggle);
            }

            if (changes.paneId) {
                if (changes.paneId.previousValue) {
                    this.paneSvc.remove(changes.paneId.previousValue);
                }

                this.paneSvc.set(changes.paneId.currentValue, this);

                this.id = changes.paneId.currentValue;
            }

            if (changes.handle) {
                this.setHandleSize(this.handle);
            }
        }

        $onDestroy() {
            let data = {
                childId: this.id,
                parentId: (this.parent) ? this.parent.id : null,
                childOb: this
            }
            this.eventSvc.$emit("fa-pane-detach",data);
            this.eventSvc.$destroy(this.subs);
        }

        $postLink() {
            var serialId = generateSerialId();
            // var $directiveScope = $parent.$new();
            // $directiveScope.$pane = $scope.$pane = $pane;
            //
            // var $transcludeScope = $directiveScope.$new();

            if (this.order == null) {
                this.order = serialId;
            }
            if (!this.paneId || this.paneId === '') {
                this.id = this.paneSvc.newId(this);
            }else {
                this.id = this.paneId;
            }

            this.subs.push(this.eventSvc.$on("fa-pane-attach", (data) => {
                let parent = data.parent;
                let child = data.child;
                let childOb = data.childOb;
                if (parent == this.id && child !== this.id) {
                    return this.addChild(childOb);
                }
            }));

            this.subs.push(this.eventSvc.$on("fa-pane-detach", (data) => {
                let parent = data.parent;
                let child = data.child;
                let childOb = data.childOb;
                if (parent == this.id && child !== this.id) {

                    return this.removeChild(childOb);
                }
            }));


            // $pane.$isolateScope = $scope;
            // $pane.$directiveScope = $directiveScope;
            // $pane.$transcludeScope = $transcludeScope;

            this.$transclude(($transcludeElement, $transcludeScope) => {
                this.$transcludeScope = $transcludeScope;
                if (this.$attrs.paneNoScroll !== 'true') {
                    $transcludeElement.addClass("fa-pane-scroller");
                    if (this.$attrs.paneScrollApi) {
                        this.setupScrollEvent(this.$element[0], $transcludeElement, $transcludeScope);
                    }
                }

                this.$element.append($transcludeElement);

                this.$containerEl = this.$element;
                this.$overlayEl = this.$element.children().eq(0);
                this.$handleEl = this.$element.children().eq(1);
                this.$scrollerEl = this.$element.children().eq(2);

                this.$window.addEventListener("resize", (e) => {
                    e.stopPropagation();
                    return this.$scheduleReflow();
                });

                this.subs.push(this.eventSvc.$on("$stateChangeSuccess", () => {
                    return this.$scheduleReflow();
                }));

                let data = {
                    childId: this.id,
                    parentId: (this.parent) ? this.parent.id : null,
                    childOb: this
                }
                this.eventSvc.$emit("fa-pane-attach", data);
        });
        }

        setupScrollEvent(elementWithScrollbar, elementInsideScrollbar, elementScope) {
            // This assignment gives access to this method to the client of the library

            var thresholdFromScrollbarAndBottom = elementScope.scrollApi.threshold || 2000 ;
            var scrollThrottleRate = elementScope.scrollApi.throttleRate || 500;
            var frequency = elementScope.scrollApi.frequency || 100;
            var waiting = false;
            var intervalHandler;

            const _scrollHandler = () => {
                if (waiting) {
                    return;
                }
                waiting = true;
                // scrolling happens very fast. buffer it using scrollThrottleRate
                this.$timeout(() => {
                    intervalHandler = this.$interval(() => {
                        var totalHeight = elementInsideScrollbar.prop('scrollHeight');
                        var hiddenContentHeight = totalHeight - elementInsideScrollbar.height();
                        if (_isScrollbarAlmostAtTheBottom(hiddenContentHeight)) {
                            var stopListen = this.scrollApi.notifyOnScroll();
                            if (stopListen) {
                                elementWithScrollbar.removeEventListener('scroll', _scrollHandler, true);
                                this.$interval.cancel(intervalHandler);
                            }
                        } else {
                            waiting = false;
                            this.$interval.cancel(intervalHandler);
                        }
                    }, frequency);
                }, scrollThrottleRate);
            }

            const _isScrollbarVisible = () => {
                return elementInsideScrollbar.prop('scrollHeight') > elementInsideScrollbar.height();
            }

            const _isScrollbarAlmostAtTheBottom = (hiddenContentHeight) => {
                return hiddenContentHeight - elementInsideScrollbar.scrollTop() <= thresholdFromScrollbarAndBottom;
            }

            elementScope.scrollApi.isScrollVisible = _isScrollbarVisible;
            elementInsideScrollbar.removeAttr('pane-scroll-api');
            elementWithScrollbar.addEventListener('scroll', _scrollHandler, true);
        };

        $scheduleReflow() {
            if (this.parent) {
                return this.parent.$scheduleReflow();
            } else if (!this.$reflowScheduled) {
                this.$reflowScheduled = true;

                return this.$evalAsync(() => {
                    if (this.$reflowScheduled) {
                        this.reflow();
                    }

                    return this.$reflowScheduled = false;
                });
            }
        }

        $onStartResize() {
            if (this.$parent) {
                return this.parent.$containerEl.addClass("fa-pane-resizing");
            } else {
                return this.$containerEl.addClass("fa-pane-resizing");
            }
        }
        onStopResize() {
            if (this.$parent) {
                return this.parent.$containerEl.removeClass("fa-pane-resizing");
            } else {
                return this.$containerEl.removeClass("fa-pane-resizing");
            }
        }
        getOptions() {
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
        }
    setOptions(options) {
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
    }
    setAnchor(anchor) {
        this.anchor = anchor;

        return this.$scheduleReflow();
    }
    setTargetSize(targetSize) {
        this.targetSize = targetSize;

        return this.$scheduleReflow();
    }
    setMinSize(min) {
        this.min = min;

        return this.$scheduleReflow();
    }
    setMaxSize(max) {
        this.max = max;

        return this.$scheduleReflow();
    }
    setOrder(order) {
        this.order = order;

        return this.$scheduleReflow();
    }
    setNoToggle(noToggle) {
        this.noToggle = noToggle;

        return this.$scheduleReflow();
    }
    setHandleSize(handleSize) {
        if ((handleSize != null ? handleSize.open : void 0) ||
            (handleSize != null ? handleSize.closed : void 0)) {

            this.handleSizeOpen = parseInt(handleSize.open, 10) || 0;
            this.handleSizeClosed = parseInt(handleSize.closed, 10) || 0;
        } else {
            this.handleSizeOpen = this.handleSizeClosed = parseInt(handleSize, 10);
        }

        return this.$scheduleReflow();
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);

        if (this.children.length) {
            this.$containerEl.addClass("fa-pane-parent");
        }

        return this.$scheduleReflow();
    }
    getOrientation() {
        return getOrientation(this.anchor);
    }
    onHandleDown() {
        return this.$containerEl.addClass("active");
    }
    onHandleUp() {
        this.$containerEl.removeClass("active");

        return this.$scheduleReflow();
    }
    removeChild(child) {
        var idx;

        if (!(0 > (idx = this.children.indexOf(child)))) {
            this.children.splice(idx, 1);
        }

        if (!this.children.length) {
            this.$containerEl.removeClass("fa-pane-parent");
        }

        return this.$scheduleReflow();
    }
    reflow(region?) {
        var width = this.$containerEl[0].offsetWidth;
        var height = this.$containerEl[0].offsetHeight;

        region || (region = new Region(width, height));

        var _ref = this.anchor;
        if (_ref === "north" || _ref === "east" || _ref === "south" || _ref === "west") {

            this.$containerEl.removeClass("fa-pane-orientation-vertical");
            this.$containerEl.removeClass("fa-pane-orientation-horizontal");

            var orientation = getOrientation(this.anchor);

            this.$containerEl.addClass("fa-pane-orientation-" + orientation);

            var handleSize = region.calculateSize(orientation, !this.closed &&
                this.handleSizeOpen || this.handleSizeClosed);

            var size = handleSize;
            if (!this.closed) {
                size = region.calculateSize(orientation, !this.closed && this.targetSize || handleSize);

                size = Math.min(size, region.calculateSize(orientation, this.max));
                size = Math.max(size, region.calculateSize(orientation, this.min));
                size = Math.min(size, region.getAvailableSize(orientation));
                size = Math.max(size, handleSize);
            }

            this.size = size;

            var styleContainer = region.consume(this.anchor, size);
            var styleScroller = getScrollerStyle(this.anchor, size - handleSize);
            var styleHandle = getHandleStyle(this.anchor, region, handleSize);

            this.$containerEl.attr("style", "").css(styleContainer);
            this.$overlayEl.attr("style", "").css(styleScroller);
            this.$handleEl.attr("style", "").css(styleHandle);
            this.$scrollerEl.attr("style", "").css(styleScroller);

        } else {
            this.$containerEl.css({
                top: region.top + "px",
                right: region.right + "px",
                bottom: region.bottom + "px",
                left: region.left + "px",
                width: "auto",
                height: "auto"
            });
        }

        this.$region = region.clone();
        this.reflowChildren(region.getInnerRegion());

        this.eventSvc.$broadcast("fa-pane-resize", this);
    }
    reflowChildren(region) {
        region || (region = this.$region);

        this.children.sort((a, b) => {
            return a.order - b.order;
        });

        var results = [];

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            results.push(child.reflow(region));
        }

        return results;
    }
    resize(size) {
        if (size == null) {
            size = this.targetSize;
        }

        this.targetSize = size;
        this.parent.reflowChildren(this.parent.$region.getInnerRegion());

        if (size !== this.size) {
            return this.$containerEl.addClass("fa-pane-constrained");
        } else {
            return this.$containerEl.removeClass("fa-pane-constrained");
        }
    }
    toggle(open) {
        // Fix for dragging on toggle
        if (faDragged) {
            faDragged = false;
            return this;
        }

        if (open == null) {
            open = !!this.closed;
        }

        this.closed = !open;
        if (this.paneId) {
            this.eventSvc.$broadcast(this.paneId + "-toggled");
        }


        var reflow = () => {
            if (this.parent) {
                return this.parent.$scheduleReflow();
            } else {
                return this.$scheduleReflow();
            }
        };

        if (this.closed) {
            this.$containerEl.addClass("fa-pane-closed");
        } else {
            this.$containerEl.removeClass("fa-pane-closed");
        }

        return reflow();
    }
    }
}

mmsApp.component(PaneComponent.selector,PaneComponent);



