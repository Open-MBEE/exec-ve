# angulartics-piwik

[![Bower version](https://badge.fury.io/bo/angulartics-piwik.svg)](https://badge.fury.io/bo/angulartics-piwik)

Piwik plugin for [angulartics](http://angulartics.github.io)

## Install

First make sure you've read installation and setup instructions for [Angulartics](https://github.com/angulartics/angulartics#install).

Then you can install this package either with `npm` or with `bower`.

### npm

    npm install --save angulartics-piwik


### Bower

    bower install --save angulartics-piwik

Add the `<script>` to your `index.html`:

    <script src="/bower_components/angulartics-piwik/dist/angulartics-piwik.min.js"></script>


Then add `angulartics.piwik` to your module:

    angular.module('myApp', ['angulartics', 'angulartics.piwik'])

Next, set the piwik tracker code as you would normally with piwik somewhere on your page, per [piwik's tracking javascript guide](http://developer.piwik.org/guides/tracking-javascript-guide):

    <!-- Piwik -->
    <script type="text/javascript">
      var _paq = _paq || [];
      // _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u="//{$PIWIK_URL}/";
        _paq.push(['setTrackerUrl', u+'piwik.php']);
        _paq.push(['setSiteId', {$IDSITE}]);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
      })();
    </script>
    <noscript><p><img src="//piwik.yourdomain.com/piwik.php?idsite={$IDSITE}" style="border:0;" alt="" /></p></noscript>
    <!-- End Piwik Code -->

In this tracking code, `{$PIWIK_URL}` would be replaced by your piwik URL and `{$IDSITE}` would be replaced by the idsite of the website you are tracking in piwik.

NOTE: Make sure that you remove or comment the initial pageview tracking line (`_paq.push(['trackPageView']);`), as shown in the code snippet above. Angulartics will track the page automatically when the first state is loaded, so this initial page track is unnecessary.

That's it! Refer to the [angulartics](http://angulartics.github.io) docs for more details on the basic tracking functions.

*NOTE: If Piwik does not register your routes properly, check the `Page URL fragments tracking` setting and enable `Keep Page URL fragments when tracking Page URLs` as described in [Piwik's FAQs](https://piwik.org/faq/how-to/faq_188/).*


## API

piwik specific trackers. For more details on this functions, see the [piwik JavaScript Tracking Client API docs](http://developer.piwik.org/api-reference/tracking-javascript)

###setCustomDimension(dimensionId, value)

Set a custom dimension. Custom dimensions are recommended over custom variables, but require the [Custom Dimensions](https://plugins.piwik.org/CustomDimensions) plugin.

See: https://piwik.org/faq/general/faq_21117/

###deleteCustomDimension(dimensionId)

Delete a previously set custom dimension.


###setCustomVariable(index, name, value, [scope])

Set a custom variable. scope can be either 'visit' or 'page'. Defaults to 'page'.

###deleteCustomVariable(index, [scope])

Delete a previously set custom variable. scope can be either 'visit' or 'page'. Defaults to 'page'.


###trackSiteSearch(keyword, [category], [count])

Log an internal site search for a specific keyword, in an optional category, specifying the optional count of search results in the page.

###trackLink(url, [linkType])

Manually log a click from your own code. url is the full URL which is to be tracked as a click.
linkType can either be 'link' for an outlink or 'download' for a download, 'link' by default.

###trackGoal(goalID, [revenue])

Manually log a conversion for the numeric goal ID, with an optional numeric custom revenue customRevenue


###setUsername(username)

Default angulartics page and event tracking

### Unsupported angulartics trackers

The following angulartics tracker functions have no piwik equivalent, and as such, are not supported. You can use `setCustomVariable()` with a `'visit'` scope for per-user properties

    $analytics.setAlias(alias)
    $analytics.setUserProperties(properties)
    $analytics.setSuperProperties(properties)

## What else?

See more docs and samples at [http://angulartics.github.io](http://angulartics.github.io "http://angulartics.github.io").

# Development

### Build
grunt uglify

## License

[MIT](LICENSE)
