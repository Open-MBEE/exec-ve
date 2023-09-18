// import { veComponents } from '@ve-components'
//
// veComponents.directive('mmsValueLink', ['ElementService', mmsValueLink])
//
// /**
//  * @ngdoc directive
//  * @name veComponents.directive:mmsValueLink
//  *
//  * @requires veUtils/ElementService
//  *
//  * @restrict E
//  * * Given an element id, generates a hyperlink with a mms-cf value
//  *
//  * @param {string} mmsElementId The id of the view
//  * @param {string} mmsProjectId The project id for the view
//  * @param {string=master} mmsRefId Reference to use, defaults to master
//  * @param {string=latest} mmsCommitId Commit ID, default is latest
//  * @param {string} mmsErrorText Text to display when element is not found
//  * @param {string} mmsLinkText Text to display for hyperlink
//  */
// function mmsValueLink(ElementService, $compile, growl) {
//     const mmsValueLinkLink = (scope, element, attrs, controllers) => {
//         const mmsCfCtrl = controllers[0]
//         const mmsViewCtrl = controllers[1]
//         let projectId = scope.mmsProjectId
//         let refId = scope.mmsRefId
//         let commitId = scope.mmsCommitId
//         if (mmsCfCtrl) {
//             const cfVersion = mmsCfCtrl.getElementOrigin()
//             if (!projectId) projectId = cfVersion.projectId
//             if (!refId) refId = cfVersion.refId
//             if (!commitId) commitId = cfVersion.commitId
//         }
//         if (mmsViewCtrl) {
//             const viewVersion = mmsViewCtrl.getElementOrigin()
//             if (!projectId) projectId = viewVersion.projectId
//             if (!refId) refId = viewVersion.refId
//             if (!commitId) commitId = viewVersion.commitId
//         }
//         if (!projectId) {
//             return
//         }
//         scope.projectId = projectId
//         scope.refId = refId ? refId : 'master'
//         scope.commitId = commitId ? commitId : 'latest'
//         const reqOb = {
//             elementId: scope.mmsElementId,
//             projectId: scope.projectId,
//             refId: scope.refId,
//             commitId: scope.commitId,
//         }
//
//         ElementService.getElement(reqOb).then(
//             (data) => {
//                 if (data.type === 'Property') {
//                     const value = data.defaultValue
//                     if (value && value.type === 'LiteralString')
//                         scope.url = value.value
//                 } else if (data.type === 'Slot') {
//                     if (
//                         Array.isArray(data.value) &&
//                         data.value.length > 0 &&
//                         data.value[0].type === 'LiteralString'
//                     ) {
//                         scope.url = data.value[0].value
//                     }
//                 } else {
//                     if (scope.mmsErrorText) {
//                         element.html(
//                             '<span class="ve-error">' +
//                                 scope.mmsErrorText +
//                                 '</span>'
//                         )
//                     } else {
//                         if (scope.mmsErrorText) {
//                             element.html(
//                                 '<span>' + scope.mmsErrorText + '</span>'
//                             )
//                         } else {
//                             element.html(
//                                 '<span class="ve-error">Element does not provide link value.</span>'
//                             )
//                         }
//                     }
//                 }
//             },
//             (reason) => {
//                 element.html(
//                     '<span class="ve-error">Element was not found.</span>'
//                 )
//             }
//         )
//     }
//
//     return {
//         restrict: 'E',
//         scope: {
//             mmsElementId: '@',
//             mmsProjectId: '@',
//             mmsRefId: '@',
//             mmsCommitId: '@',
//             mmsErrorText: '@',
//             mmsLinkText: '@',
//         },
//         require: ['?^^mmsCf', '?^^view'],
//         template: '<a ng-href="{{url}}">{{mmsLinkText}}</a>',
//         link: mmsValueLinkLink,
//     }
// }
