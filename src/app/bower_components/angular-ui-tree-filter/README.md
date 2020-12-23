#ui.tree-filter [![Build Status](https://travis-ci.org/EE/angular-ui-tree-filter.svg?branch=master)](https://travis-ci.org/EE/angular-ui-tree-filter) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

A module providing an [AngularJS](http://angularjs.org/) filter which can be used with [angular-ui-tree](http://github.com/JimLiu/angular-ui-tree) to match tree nodes.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [How it works?](#how-it-works)
- [How to use?](#how-to-use)
- [Configuration reference](#configuration-reference)
- [Performance](#performance)
- [Support](#support)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How it works?

1. It's is configurable: 
  - you may provide default properties of your nodes that should matched against provided pattern:

```
angular.module('myApp')
  .config(function (uiTreeFilterSettingsProvider) {
    uiTreeFilterSettingsProvider.addresses = ['title', 'description', 'username'];
  });
```

  - or you may pass property list as an optional 3rd argument:

```
$filter('uiTreeFilter')(nodeObject, pattern, ['title', 'description', 'username'])
```

2. It matches the whole path
If a sub-node matches all its ancestors up to the tree root match as well:

```
Filtered string: "the matched string"

    1. Foo
    2. Bar                            # matches as one of its descendants matches
        2.1 Baz                       # matches as one of its descendants matches
            2.1.1 The matched string  # matches exactly
```

## How to use?

Filter can be used in the template to as an argument of the `ng-show` or `ng-if`.

```html
<input ng-model="pattern">
<script type="text/ng-template" id="items_renderer.html">
  <div ui-tree-handle>{{item.title}}</div>
  <ol ui-tree-nodes ng-model="item.items">
    <li ng-repeat="item in item.items" ui-tree-node ng-include="'items_renderer.html'" 
        ng-hide="filter(item, pattern)">
    </li>
  </ol>
</script>
<div ui-tree>
  <ol ui-tree-nodes ng-model="list">
    <li ng-repeat="item in list" ui-tree-node ng-include="'items_renderer.html'" 
        ng-hide="filter(item, pattern)"></li>
  </ol>
</div>
```

## Configuration reference

- `addresses` (default: `['title']`): properties of notes against which pattern will be matched.
   Deep filed access is supported: one can provide `foo.bar.baz` to match against item.foo.bar.baz value. 
- `regexFlags` (default: `'gi'`): [Regular expression flags](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp#Parameters) applied during he matching
- `descendantCollection` (default: `'items'`): name of item property that holds item descendants

## Performance

The filter is not provided with any performance improving mechanisms. It may turn out suboptimal for large trees with 
thousands of nodes and. If you need it to become perform better let us know what your case is by 
[filing an issue](https://github.com/ee/angular-ui-tree-filter/issues/new)

## Support

Basically all the browsers down to Firefox 3.0, IE 9, Opera 10.5 and Safari 4.0 are supported.

Potential support blockers:

- `Array.reduce` [support](http://kangax.github.io/compat-table/es5/#Array.prototype.reduce): Fx 3, IE 9, Op 10.5, Sf4
- `Array.forEach` [support](http://kangax.github.io/compat-table/es5/#Array.prototype.forEach) IE 9

If you wish to support IE8 (as AngularJS 1.2.x do) you'd have to provide proper polyfills.
But you [know it anyway](https://docs.angularjs.org/guide/ie)

License
-------

The module is available under the MIT license (see LICENSE for details).
