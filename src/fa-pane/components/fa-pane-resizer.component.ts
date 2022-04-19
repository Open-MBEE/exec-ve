import * as angular from 'angular';
import {handleChange} from "../../ve-utils/utils/change.util";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {faPaneModule} from "../fa-pane.main";


let FaPaneResizerComponent: VeComponentOptions = {
    selector: "faPaneResizer",
    template: `
    <fa-pane-toggle ng-if="!$ctrl.faPane.noToggle" class="fa-pane-toggle" ng-click="$ctrl.faPane.toggle()"></fa-pane-toggle>    
`,
    transclude: true,
    bindings: {
        faPane: "<",
        faDragged: "<",
        faOrientation: "<"
    },
    controller: class FaPaneResizerController implements angular.IComponentController {

        private faPane
        private faOrientation
        private faDragged

        static $inject = ['$window', '$scope', '$element', '$attrs'];

        constructor(private $window: angular.IWindowService, private $scope: angular.pane.IPaneScope,
                    private $element: angular.IRootElementService, private $attrs: angular.IAttributes) {
        }

        $onInit() {
        }

        $onChanges(onChangesObj: angular.IOnChangesObject) {
            handleChange(onChangesObj, 'faOrientation', (orientation) => {
                this.$element.removeClass("vertical");
                this.$element.removeClass("horizontal");

                switch (orientation) {
                    case "vertical":
                        return this.$element.addClass("vertical");
                    case "horizontal":
                        return this.$element.addClass("horizontal");
                }
            });
        }

        throttle(delay, fn) {
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
        $postLink() {

            var el = this.$element[0];

            var clickRadius = 5;
            var clickTime = 300;



            el.addEventListener("mousedown", (e: MouseEvent | null) => {
                if (e && e.button !== 0) {
                    return;
                }else {
                    e = e as MouseEvent;
                }

                var anchor = this.faPane.anchor;
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
                var startSize = this.faPane.size;
                var startTime = Date.now();

                //pane.onHandleDown();

                el.onselectstart = function() {
                    return false;
                };
                el.style.userSelect = "none";

                // Null out the event to re-use e and prevent memory leaks
                //e.setCapture();
                e.preventDefault();
                e = null;

                var handleMouseMove = (e: MouseEvent | null) => {
                    if (e) {
                        e = e as MouseEvent;
                    }else {
                        return
                    }
                    this.faDragged = true; // Fix for dragging on toggle

                    this.faPane.$onStartResize();

                    // Inside Angular's digest, determine the ideal size of the element
                    // according to movements then determine if those movements have been
                    // constrained by boundaries, other panes or min/max clauses
                    //this.$scope.$apply(() => {
                    var targetSize = startSize + scale * (e[coord] - startCoord);

                    this.faPane.resize(targetSize);
                    //});

                    // Null out the event in case of memory leaks
                    //e.setCapture();
                    e.preventDefault();
                    return e = null;
                };

                var handleMouseUp = (e: MouseEvent | null) => {
                    if (e) {
                        e = e as MouseEvent;
                    }else {
                        return
                    }
                    var displacementSq = Math.pow(e.screenX - startPos.x, 2) +
                        Math.pow(e.screenY - startPos.y, 2);
                    var timeElapsed = Date.now() - startTime;

                    this.$window.removeEventListener("mousemove", handleMouseMoveThrottled, true);
                    this.$window.removeEventListener("mouseup", handleMouseUp, true);

                    var cleanup = () => {
                        if (e) {
                            e = e as MouseEvent;
                        }else {
                            return
                        }
                        this.faPane.$onStopResize();

                        // Null out the event in case of memory leaks
                        //e.releaseCapture();
                        e.preventDefault();
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
                var handleMouseMoveThrottled = this.throttle(10, handleMouseMove);

                this.$window.addEventListener("mouseup", handleMouseUp, true);
                return this.$window.addEventListener("mousemove", handleMouseMoveThrottled, true);
            });
        }
    }
}

faPaneModule.component(FaPaneResizerComponent.selector,FaPaneResizerComponent)