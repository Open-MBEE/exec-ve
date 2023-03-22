import angular, { IScope } from 'angular'
import _ from 'lodash'

import { angularjsDropdownMultiselect } from '../angularjs-dropdown-multiselect.module'

interface NgDropdownMultiselectScope extends IScope {
    open?: unknown
    externalEvents: {
        onSelectAll(): void
        onDeselectAll(): void
        onItemDeselect(findObj: { [key: string]: string }): void
        onItemSelect(selectedObj: { [key: string]: string }): void
        onInitDone(): void
        onMaxSelectionReached(): void
    }
    settings: NgDropdownMultiselectSettings
    texts?: {
        checkAll: string
        uncheckAll: string
        selectionCount: string
        selectionOf: string
        searchPlaceholder: string
        buttonDefaultText: string
        dynamicButtonTextSuffix: string
    }
    searchFilter?: unknown
    orderedItems?: unknown
    singleSelection?: boolean
    selectedModel?: { [key: string]: string }[]
    getGroupTitle?(groupValue: string): string
    extraSettings?: unknown
    events?: unknown
    translationTexts?: unknown
    getButtonText?(): string
    options?: { [key: string]: string }[]

    toggleDropdown(): void
    checkboxClick($event, id): void
    setSelectedItem(id: string, dontRemove?: boolean): void
    isChecked(id: string): boolean
    getPropertyForObject(object: { [key: string]: string } | string, property: string): string

    selectAll(): void
    deselectAll(sendEvent: boolean)
}

interface NgDropdownMultiselectSettings {
    dynamicTitle: boolean
    scrollable: boolean
    scrollableHeight: string
    closeOnBlur: boolean
    displayProp: string
    idProp: string
    externalIdProp: string
    enableSearch: boolean
    selectionLimit: number
    showCheckAll: boolean
    showUncheckAll: boolean
    closeOnSelect: boolean
    buttonClasses: string
    closeOnDeselect: boolean
    groupBy?: string
    smartButtonMaxItems: number
    smartButtonTextConverter?(displayText: string, optionItem: { [key: string]: string } | string): string
    groupByTextProvider?(groupValue: string): string
}

angularjsDropdownMultiselect.directive('ngDropdownMultiselect', [
    '$filter',
    '$document',
    '$compile',
    '$parse',
    ngDropdownMultiselect,
])

function ngDropdownMultiselect(
    $filter: angular.IFilterService,
    $document: angular.IDocumentService,
    $compile: angular.ICompileService,
    $parse: angular.IParseService
): angular.IDirective {
    return {
        restrict: 'AE',
        scope: {
            selectedModel: '=',
            options: '=',
            extraSettings: '=',
            events: '=',
            searchFilter: '=?',
            translationTexts: '=',
            groupBy: '@',
        },
        template: (element, attrs): string => {
            const checkboxes = !!attrs.checkboxes
            const groups = !!attrs.groupBy

            let template =
                '<div class="multiselect-parent btn-group dropdown-multiselect ve-light-dropdown" ng-value="getButtonText()">'
            template +=
                '<button type="button" class="dropdown-toggle" ng-class="settings.buttonClasses" ng-click="toggleDropdown()">{{getButtonText()}}&nbsp;<i class="fa fa-caret-down" aria-hidden="true"></i></button>'
            template +=
                '<ul class="dropdown-menu dropdown-menu-form menu-with-input" ng-style="{display: open ? \'block\' : \'none\', height : settings.scrollable ? settings.scrollableHeight : \'auto\' }" style="overflow-y: scroll" >'
            template +=
                '<li ng-hide="!settings.showCheckAll || settings.selectionLimit > 0"><a data-ng-click="selectAll()"><span class="fa fa-check"></span>  {{texts.checkAll}}</a>'
            template +=
                '<li ng-show="settings.showUncheckAll"><a data-ng-click="deselectAll();"><span class="remove-list-item"></span>   {{texts.uncheckAll}}</a></li>'
            //template += '<li ng-hide="(!settings.showCheckAll || settings.selectionLimit > 0) && !settings.showUncheckAll" class="divider"></li>';
            template +=
                '<li class="dropdown-input" ng-show="settings.enableSearch"><input type="text" class="ve-plain-input" ng-model="searchFilter" placeholder="{{texts.searchPlaceholder}}" /></li>'
            //template += '<li ng-show="settings.enableSearch" class="divider"></li>';

            if (groups) {
                template +=
                    '<li ng-repeat-start="option in orderedItems | filter: searchFilter" ng-show="getPropertyForObject(option, settings.groupBy) !== getPropertyForObject(orderedItems[$index - 1], settings.groupBy)" role="presentation" class="dropdown-header">{{ getGroupTitle(getPropertyForObject(option, settings.groupBy)) }}</li>'
                template += '<li ng-repeat-end role="presentation">'
            } else {
                template += '<li role="presentation" ng-repeat="option in options | filter: searchFilter">'
            }

            template +=
                '<a role="menuitem" tabindex="-1" ng-click="setSelectedItem(getPropertyForObject(option,settings.idProp))">'

            if (checkboxes) {
                template +=
                    '<div class="checkbox"><label><input class="checkboxInput" type="checkbox" ng-click="checkboxClick($event, getPropertyForObject(option,settings.idProp))" ng-checked="isChecked(getPropertyForObject(option,settings.idProp))" /> {{getPropertyForObject(option, settings.displayProp)}}</label></div></a>'
            } else {
                template +=
                    '<span data-ng-class="{\'checked-list-item\': isChecked(getPropertyForObject(option,settings.idProp))}"></span> {{getPropertyForObject(option, settings.displayProp)}}</a>'
            }

            template += '</li>'

            template += '<li class="divider" ng-show="settings.selectionLimit > 1"></li>'
            template +=
                '<li role="presentation" ng-show="settings.selectionLimit > 1"><a role="menuitem">{{selectedModel.length}} {{texts.selectionOf}} {{settings.selectionLimit}} {{texts.selectionCount}}</a></li>'

            template += '</ul>'
            template += '</div>'

            element.html(template)
            return template
        },
        link: ($scope: NgDropdownMultiselectScope, $element, $attrs: angular.IAttributes): void => {
            const $dropdownTrigger = $element.children()[0]

            $scope.toggleDropdown = (): void => {
                $scope.open = !$scope.open
            }

            $scope.checkboxClick = ($event: JQuery.ClickEvent, id: string): void => {
                $scope.setSelectedItem(id)
                $event.stopImmediatePropagation()
            }
            /* eslint-disable @typescript-eslint/no-empty-function */
            $scope.externalEvents = {
                onItemSelect: (): void => {},
                onItemDeselect: (): void => {},
                onSelectAll: (): void => {},
                onDeselectAll: (): void => {},
                onInitDone: (): void => {},
                onMaxSelectionReached: (): void => {},
            }

            $scope.settings = {
                dynamicTitle: true,
                scrollable: false,
                scrollableHeight: '300px',
                closeOnBlur: true,
                displayProp: 'label',
                idProp: 'id',
                externalIdProp: 'id',
                enableSearch: false,
                selectionLimit: 0,
                showCheckAll: true,
                showUncheckAll: true,
                closeOnSelect: false,
                buttonClasses: 'btn btn-default',
                closeOnDeselect: false,
                groupBy: ($attrs.groupBy as string) || undefined,
                groupByTextProvider: null,
                smartButtonMaxItems: 0,
                smartButtonTextConverter: (): string => null,
            }
            /* eslint-enable @typescript-eslint/no-empty-function */
            $scope.texts = {
                checkAll: 'Check All',
                uncheckAll: 'Uncheck All',
                selectionCount: 'checked',
                selectionOf: '/',
                searchPlaceholder: 'Search...',
                buttonDefaultText: 'Select',
                dynamicButtonTextSuffix: 'checked',
            }

            $scope.searchFilter = $scope.searchFilter || ''

            if (angular.isDefined($scope.settings.groupBy)) {
                $scope.$watch('options', (newValue: unknown[]) => {
                    if (angular.isDefined(newValue)) {
                        $scope.orderedItems = $filter('orderBy')(newValue, $scope.settings.groupBy)
                    }
                })
            }

            angular.extend($scope.settings, $scope.extraSettings || [])
            angular.extend($scope.externalEvents, $scope.events || [])
            angular.extend($scope.texts, $scope.translationTexts)

            $scope.singleSelection = $scope.settings.selectionLimit === 1

            function getFindObj(id: string): { [key: string]: string } {
                const findObj = {}

                if ($scope.settings.externalIdProp === '') {
                    findObj[$scope.settings.idProp] = id
                } else {
                    findObj[$scope.settings.externalIdProp] = id
                }

                return findObj
            }

            function clearObject(object: { [key: string]: unknown }): void {
                for (const prop in object) {
                    delete object[prop]
                }
            }

            if ($scope.singleSelection) {
                if (Array.isArray($scope.selectedModel) && $scope.selectedModel.length === 0) {
                    clearObject($scope.selectedModel[0] as { [key: string]: unknown })
                }
            }

            if ($scope.settings.closeOnBlur) {
                $document.on('click', (e) => {
                    let target = (e.target as HTMLElement).parentElement
                    let parentFound = false

                    while (angular.isDefined(target) && target !== null && !parentFound) {
                        if (_.includes(target.className.split(' '), 'multiselect-parent') && !parentFound) {
                            if (target === $dropdownTrigger) {
                                parentFound = true
                            }
                        }
                        target = target.parentElement
                    }

                    if (!parentFound) {
                        $scope.$apply(() => {
                            $scope.open = false
                        })
                    }
                })
            }

            $scope.getGroupTitle = (groupValue: string): string => {
                if ($scope.settings.groupByTextProvider !== null) {
                    return $scope.settings.groupByTextProvider(groupValue)
                }

                return groupValue
            }

            $scope.getButtonText = (): string => {
                if (
                    $scope.settings.dynamicTitle &&
                    ($scope.selectedModel.length > 0 ||
                        (angular.isObject($scope.selectedModel) && _.keys($scope.selectedModel).length > 0))
                ) {
                    if ($scope.settings.smartButtonMaxItems > 0) {
                        let itemsText: any[] = []

                        $scope.options.forEach((optionItem: { [key: string]: string } | string) => {
                            if ($scope.isChecked($scope.getPropertyForObject(optionItem, $scope.settings.idProp))) {
                                const displayText = $scope.getPropertyForObject(optionItem, $scope.settings.displayProp)
                                const converterResponse = $scope.settings.smartButtonTextConverter(
                                    displayText,
                                    optionItem
                                )

                                itemsText.push(converterResponse ? converterResponse : displayText)
                            }
                        })

                        if ($scope.selectedModel.length > $scope.settings.smartButtonMaxItems) {
                            itemsText = itemsText.slice(0, $scope.settings.smartButtonMaxItems)
                            itemsText.push('...')
                        }

                        return itemsText.join(', ')
                    } else {
                        let totalSelected: number

                        if ($scope.singleSelection) {
                            totalSelected =
                                $scope.selectedModel !== null &&
                                angular.isDefined($scope.selectedModel[$scope.settings.idProp])
                                    ? 1
                                    : 0
                        } else {
                            totalSelected = angular.isDefined($scope.selectedModel) ? $scope.selectedModel.length : 0
                        }

                        if (totalSelected === 0) {
                            return $scope.texts.buttonDefaultText
                        } else {
                            return `${totalSelected} ${$scope.texts.dynamicButtonTextSuffix}`
                        }
                    }
                } else {
                    return $scope.texts.buttonDefaultText
                }
            }

            $scope.getPropertyForObject = (object: { [key: string]: string }, property: string): string => {
                if (angular.isDefined(object) && object.hasOwnProperty(property)) {
                    return object[property]
                }

                return ''
            }

            $scope.selectAll = (): void => {
                $scope.deselectAll(false)
                $scope.externalEvents.onSelectAll()

                $scope.options.forEach((value) => {
                    $scope.setSelectedItem(value[$scope.settings.idProp], true)
                })
            }

            $scope.deselectAll = (sendEvent): void => {
                sendEvent = sendEvent || true

                if (sendEvent) {
                    $scope.externalEvents.onDeselectAll()
                }

                if ($scope.singleSelection) {
                    clearObject($scope.selectedModel[0])
                } else {
                    $scope.selectedModel.splice(0, $scope.selectedModel.length)
                }
            }

            $scope.setSelectedItem = (id, dontRemove?): void => {
                const findObj = getFindObj(id)
                let finalObj: {
                    [key: string]: string
                }

                if ($scope.settings.externalIdProp === '') {
                    finalObj = _.find($scope.options, findObj) as {
                        [key: string]: string
                    }
                } else {
                    finalObj = findObj
                }

                if ($scope.singleSelection) {
                    clearObject($scope.selectedModel[0])
                    angular.extend($scope.selectedModel, finalObj)
                    $scope.externalEvents.onItemSelect(finalObj)
                    if ($scope.settings.closeOnSelect) $scope.open = false

                    return
                }

                dontRemove = dontRemove || false

                const exists = _.findIndex($scope.selectedModel, findObj) !== -1

                if (!dontRemove && exists) {
                    $scope.selectedModel.splice(_.findIndex($scope.selectedModel, findObj), 1)
                    $scope.externalEvents.onItemDeselect(findObj)
                } else if (
                    !exists &&
                    ($scope.settings.selectionLimit === 0 ||
                        $scope.selectedModel.length < $scope.settings.selectionLimit)
                ) {
                    $scope.selectedModel.push(finalObj)
                    $scope.externalEvents.onItemSelect(finalObj)
                }
                if ($scope.settings.closeOnSelect) $scope.open = false
            }

            $scope.isChecked = (id): boolean => {
                if ($scope.singleSelection) {
                    return (
                        $scope.selectedModel !== null &&
                        angular.isDefined($scope.selectedModel[$scope.settings.idProp]) &&
                        $scope.selectedModel[$scope.settings.idProp] === getFindObj(id)[$scope.settings.idProp]
                    )
                }

                return _.findIndex($scope.selectedModel, getFindObj(id)) !== -1
            }

            $scope.externalEvents.onInitDone()
        },
    }
}
