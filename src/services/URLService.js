'use strict';

angular.module('mms')
.provider('URLService', function URLServiceProvider() {
    var baseUrl = '/alfresco/service';
    
    this.setBaseUrl = function(base) {
        baseUrl = base;
    };
    
    this.$get = [function URLServiceFactory() {
        return urlService(baseUrl);
    }];
});

/**
 * @ngdoc service
 * @name mms.URLService
 * 
 * @description
 * This utility service gives back url paths for use in other services in communicating
 * with the server, arguments like workspace, version are expected to be strings and
 * not null or undefined. This service is usually called by higher level services and
 * should rarely be used directly by applications.
 *
 * To configure the base url of the ems server, you can use the URLServiceProvider
 * in your application module's config. By default, the baseUrl is '/alfresco/service' 
 * which assumes your application is hosted on the same machine as the ems. 
 *  <pre>
        angular.module('myApp', ['mms'])
        .config(function(URLServiceProvider) {
            URLServiceProvider.setBaseUrl('https://ems.jpl.nasa.gov/alfresco/service');
        });
    </pre>
 * (You may run into problems like cross origin security policy that prevents it from
 *  actually getting the resources from a different server, solution TBD)
 */
function urlService(baseUrl) {
    var root = baseUrl;
    var ticket;
    /**
     * @ngdoc method
     * @name mms.URLService#isTimestamp
     * @methodOf mms.URLService
     * 
     * @description
     * self explanatory
     *
     * @param {string} version A version string or timestamp
     * @returns {boolean} Returns true if the string has '-' in it
     */
    var isTimestamp = function(version) {
        if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+]?-\d{4}$/.test(version.trim()))
            return true;
        return false;
        
        // if (String(version).indexOf('-') >= 0)
        //     return true;
        // return false;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getMmsVersionURL
     * @methodOf mms.URLService
     * 
     * @description
     * self explanatory
     *
     * @returns {object} Returns object with mmsversion
     */
    var getMmsVersionURL = function() {
        return addTicket(root + "/mmsversion");
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getHtmlToPdfURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that to convert HTML to PDF
     *
     * @param {string} docId Id of the document
     * @param {string} site Site name
     * @param {string} workspace Workspace name
     * @returns {string} The url
     */
    var getHtmlToPdfURL = function(docId, projectId, refId) {
        return addTicket(root + "/projects/" + projectId +
                      "/refs/" + refId +
                      "/documents/" + docId +
                      "/htmlToPdf/123456789");  
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getCheckLoginURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that checks the login
     *
     * @returns {string} The url
     */
    var getCheckLoginURL = function() {
        return root + "/checklogin";
    };

    var getOrgsURL = function() {
        return addTicket(root + "/orgs");
    };

    var getProjectsURL = function(orgId) {
        if (orgId)
            return addTicket(root + "/orgs/" + orgId + '/projects');
        return addTicket(root + '/projects');
    };

    var getProjectURL = function(projectId) {
        return addTicket(root + "/projects/" + projectId);
    };

    var getRefsURL = function(projectId) {
        return addTicket(root + '/projects/' + projectId + '/refs');
    };

    var getRefURL = function(projectId, refId) {
        return addTicket(root + '/projects/' + projectId + '/refs/' + refId);
    };

    var getGroupsURL = function(projectId, refId) {
        return addTicket(root + '/projects/' + projectId + '/refs/' + refId + '/groups');
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSiteProductsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that gets products in a site
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url
     */
    var getProjectDocumentsURL = function(reqOb) {
        var r = root + "/projects/" + reqOb.projectId + 
                      "/refs/" + reqOb.refId + 
                      "/documents";
        return addExtended(addTicket(addVersion(r, reqOb.commitId)), reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getImageURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url for querying an image url
     * (this is not the actual image path)
     * 
     * @returns {string} The path for image url queries.
     */
    var getImageURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/artifacts/' +
                       reqOb.elementId + '?accept=' + reqOb.accept;
        return addTicket(addVersion(r, reqOb.commitId));
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSiteDashboardURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for a site dashboard.
     * 
     * @param {string} site Site name (not title!).
     * @returns {string} The path for site dashboard.
     */
    var getSiteDashboardURL = function(site) {
        return addTicket("/share/page/site/" + site + "/dashboard");
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for an element
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    var getElementURL = function(reqOb) {        
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        return addExtended(addTicket(addVersion(r, reqOb.commitId)), reqOb.extended);
    };

    var getOwnedElementURL = function(reqOb) {
        var recurseString = 'recurse=true';
        if (reqOb.depth)
            recurseString = 'depth=' + reqOb.depth;
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        r = addVersion(r, reqOb.commitId);
        if (r.indexOf('?') > 0)
            r += '&' + recurseString;
        else
            r += '?' + recurseString;
        return addTicket(addExtended(r, reqOb.extended));        
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getDocumentViewsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url to get all views in a document
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    var getDocumentViewsURL = function(reqOb) {
        var r = root + "/projects/" + reqOb.projectId + "/refs/" + reqOb.refId + 
            '/documents/' + reqOb.elementId + "/views";
        r = addVersion(r, reqOb.commitId);
        return addExtended(addTicket(r), reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementVersionsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url to query for element history
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    var getElementHistoryURL = function(reqOb) {
        return addTicket(root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/history');
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getPostElementsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for posting element changes.
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    var getPostElementsURL = function(reqOb) {
        return addExtended(addChildViews(addTicket(root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements'), reqOb.returnChildViews), reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getPutElementsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for getting multiple elements (using put with body).
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    var getPutElementsURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements';
        return addExtended(addTicket(addVersion(r, reqOb.commitId)), reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#handleHttpStatus
     * @methodOf mms.URLService
     * 
     * @description
     * Utility for setting the state of a deferred object based on the status
     * of http error. The arguments are the same as angular's $http error 
     * callback
     * 
     * @param {Object} data The http response
     * @param {number} status Http return status
     * @param {Object} header Http return header
     * @param {Object} config Http config
     * @param {Object} deferred A deferred object that would be rejected 
     *      with this object based on the http status: 
     *      ```
     *          {
     *              status: status,
     *              message: http status message,
     *              data: data
     *          }
     *      ```
     */
    var handleHttpStatus = function(data, status, header, config, deferred) {
        var result = {status: status, data: data};
        if (status === 404)
            result.message = "Not Found";
        else if (status === 500) {
            if (angular.isString(data) && data.indexOf("ENOTFOUND") >= 0)
                result.message = "Network Error (Please check network)";
            else
                result.message = "Server Error";
        } else if (status === 401 || status === 403)
            result.message = "Permission Error";
        else if (status === 409)
            result.message = "Conflict";
        else if (status === 400)
            result.message = "Bad Request";
        else if (status === 410)
            result.message = "Deleted";
        else if (status === 408)
            result.message = "Timed Out";
        else if (status === 501) {
            result.message = "Cacheing";
        } else
            result.message = "Timed Out (Please check network)";
        deferred.reject(result);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementSearchURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url for element keyword search.
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    var getElementSearchURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/search';
        return addExtended(addTicket(r), true);
    };

    var getWsDiffURL = function(ws1, ws2, ws1time, ws2time, recalc) {
        var diffUrl =  root + '/diff/' + ws1 + '/' + ws2 + '/' + ws1time + '/' + ws2time  + '?background=true';
        if(recalc === true) diffUrl += '&recalculate=true';
        
        return addTicket(diffUrl);
        /*if (ws1time && ws1time !== 'latest')
            r += '&timestamp1=' + ws1time;
        if (ws2time && ws2time !== 'latest')
            r += '&timestamp2=' + ws2time;
        return r;*/
    };

    var getPostWsDiffURL = function(sourcetime) {
        var r = root + '/diff';
        if (sourcetime && isTimestamp(sourcetime))
            r += '?timestamp2=' + sourcetime;
        return addTicket(r);
    };
    
    var getJobs = function(id) {
        return addTicket(root + '/workspaces/master/jobs/' + id + '?recurse=1');
    };

    var getJob = function(jobSyml){
        return addTicket(root + '/workspaces/master/jobs/' + jobSyml);
    };

    var getJenkinsRun = function(jobSyml) {
        return addTicket(root + '/workspaces/master/jobs/'+ jobSyml + '/execute');
    };
    
    var getCreateJob = function() {
        var link = '/alfresco/service/workspaces/master/jobs';
        return addTicket(root + '/workspaces/master/jobs');
    };

    var getLogoutURL = function() {
        return addTicket(root + '/api/login/ticket/' + ticket);
    };
    
    var getCheckTicketURL = function(t) {
        return root + '/mms/login/ticket/' + t;//+ '?alf_ticket=' + t; //TODO remove when server returns 404
    };
    
    var addVersion = function(url, version) {
        if (version === 'latest')
            return url;
        else if (version) {
            if (url.indexOf('?') > 0)
                return url + '&commitId=' + version;
            else
                return url + '?commitId=' + version;
        } 
        return url;
    };

    var addTicket = function(url) {
        var r = url;
        if (!ticket)
            return r;
        if (r.indexOf('commitId') > 0) //TODO check mms cache rules
            return r;
        if (r.indexOf('?') > 0)
            r += '&alf_ticket=' + ticket;
        else
            r += '?alf_ticket=' + ticket;
        return r;    
    };

    var addExtended = function(url, extended) {
        var r = url;
        if (!extended)
            return r;
        if (r.indexOf('?') > 0)
            r += '&extended=true';
        else
            r += '?extended=true';
        return r;
    };

    var addChildViews = function(url, add) {
        var r = url;
        if (!add)
            return r;
        if (r.indexOf('?') > 0)
            r += '&childviews=true';
        else
            r += '?childviews=true';
        return r;
    };

    var getRoot = function() {
        return root;
    };

    var setTicket = function(t) {
        ticket = t;
    };
    
    var getJMSHostname = function(){
        return root + '/connection/jms';
    };

    return {
        getMmsVersionURL: getMmsVersionURL,
        getSiteDashboardURL: getSiteDashboardURL,
        getOrgsURL: getOrgsURL,
        getProjectsURL: getProjectsURL,
        getProjectURL: getProjectURL,
        getRefsURL: getRefsURL,
        getRefURL: getRefURL,
        getGroupsURL: getGroupsURL,
        getElementURL: getElementURL,
        getPutElementsURL: getPutElementsURL,
        getPostElementsURL: getPostElementsURL,
        getOwnedElementURL: getOwnedElementURL,
        getElementHistoryURL: getElementHistoryURL,
        getElementSearchURL: getElementSearchURL,
        getProjectDocumentsURL: getProjectDocumentsURL,
        getDocumentViewsURL: getDocumentViewsURL,
        handleHttpStatus: handleHttpStatus,
        getImageURL: getImageURL,
        getHtmlToPdfURL: getHtmlToPdfURL,
        getWsDiffURL: getWsDiffURL,
        getPostWsDiffURL: getPostWsDiffURL,
        getJobs: getJobs,
        getJob: getJob,
        getJenkinsRun: getJenkinsRun,
        getCreateJob: getCreateJob,
        getCheckLoginURL: getCheckLoginURL,
        getCheckTicketURL: getCheckTicketURL,
        getLogoutURL: getLogoutURL,
        isTimestamp: isTimestamp,
        getRoot: getRoot,
        setTicket: setTicket,
        getJMSHostname: getJMSHostname
    };

}