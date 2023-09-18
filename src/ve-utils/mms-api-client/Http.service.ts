import { veUtils } from '@ve-utils';

export type httpCallback<T> = (response: angular.IHttpResponse<T>) => void;

export interface HttpServiceRequest {
    url: string;
    successCallback: httpCallback<unknown>;
    errorCallback: httpCallback<unknown>;
    weight: number;
}

/**
 * @ngdoc service
 * @name veUtils/HttpService
 * * Provides prioritization and caching for $http service calls
 */
export class HttpService {
    private queue: HttpServiceRequest[][] = [];
    cache: { [key: string]: HttpServiceRequest } = {};
    inProgress = 0;
    getLimit = 20;

    static $inject = ['$http'];

    constructor(private $http: angular.IHttpService) {
        this.queue[0] = []; //high proirity
        this.queue[1] = []; //low prority
    }

    setOutboundLimit = (limit: number): void => {
        this.getLimit = limit;
    };

    getQueue(): HttpServiceRequest[][] {
        return this.queue;
    }

    /**
     * @name veUtils/HttpService#get
     * Put a new get request in the queue, the queue is FIFO
     *
     * @param {string} url url to get
     * @param {function} successCallback success function
     * @param {function} errorCallback function
     * @param {string} weight by weight
     * @param {Object} config object containing http configuration parameters
     */
    get<T>(url: string, successCallback: httpCallback<T>, errorCallback: httpCallback<T>, weight: number): void {
        if (weight === undefined) {
            weight = 1;
        }
        const request: HttpServiceRequest = {
            url: url,
            successCallback: successCallback,
            errorCallback: errorCallback,
            weight: weight,
        };
        if (this.inProgress >= this.getLimit) {
            if (request.weight === 2) {
                this.$http
                    .get(url)
                    .then(
                        (response: angular.IHttpResponse<T>) => {
                            successCallback(response);
                        },
                        (response: angular.IHttpResponse<T>) => {
                            errorCallback(response);
                        }
                    )
                    .finally(() => {
                        if (this.cache.hasOwnProperty(url)) {
                            delete this.cache[url];
                        }
                    });
            } else if (request.weight === 0) {
                this.queue[0].push(request);
            } else {
                this.queue[1].push(request);
            }
            if (this.cache.hasOwnProperty(url)) {
                if (this.cache[url].weight < request.weight) this.cache[url].weight = request.weight;
            } else {
                this.cache[url] = request;
            }
        } else {
            this.inProgress++;
            this.cache[url] = request;
            this.$http
                .get(url)
                .then(
                    (response: angular.IHttpResponse<T>) => {
                        successCallback(response);
                    },
                    (response: angular.IHttpResponse<T>) => {
                        errorCallback(response);
                    }
                )
                .finally(() => {
                    this.inProgress--;
                    let next: HttpServiceRequest;
                    if (this.cache.hasOwnProperty(url)) {
                        delete this.cache[url];
                    }
                    if (this.queue[1].length > 0) {
                        next = this.queue[1].shift();
                        this.get(next.url, next.successCallback, next.errorCallback, next.weight);
                    } else if (this.queue[0].length > 0) {
                        next = this.queue[0].shift();
                        this.get(next.url, next.successCallback, next.errorCallback, next.weight);
                    }
                });
        }
    }

    /**
     * @name veUtils/HttpService#ping
     * If the current queue has an ongoing request, put it in front
     *
     * @param {string} url url to get
     * @param {number} weight (optional)
     */
    ping = (url: string, weight?: number): void => {
        // ping should simply change the weight
        if (weight === undefined) {
            weight = 1;
        }
        if (this.cache.hasOwnProperty(url)) {
            if (weight > this.cache[url].weight) {
                const request = this.cache[url];
                let index: number;
                if (request.weight === 0) index = this.queue[0].indexOf(request);
                else index = this.queue[1].indexOf(request);
                if (weight === 1 && index !== -1) {
                    request.weight = 1;
                    this.queue[1].push(request);
                    this.queue[0].splice(index, 1);
                } else if (weight === 2 && index !== -1) {
                    if (request.weight === 0) {
                        this.queue[0].splice(index, 1);
                    } else {
                        this.queue[1].splice(index, 1);
                    }
                    this.get(request.url, request.successCallback, request.errorCallback, weight);
                }
            }
        }
    };

    /**
     * @name veUtils/HttpService#ping
     *
     * @description Changes all requests in the Queue 1 to Queue 0
     */
    transformQueue = (): void => {
        if (this.queue[1].length > 0) {
            //will the queue ever be defined?
            for (let i = 0; i < this.queue[1].length; i++) {
                this.queue[1][i].weight = 0;
                // if(cache.hasOwnProperty(queue[1][i].request.url))
                //     cache[queue[1][i].request.url].weight = 0;
                this.queue[0].push(this.queue[1][i]);
                //queue[1][i].shift();
            }
            //queue[0] = queue[0].concat(queue[1]);
            this.queue[1] = [];
        }
    };

    dropAll = (): void => {
        this.queue[1].length = 0;
        this.queue[0].length = 0;
        this.cache = {};
        this.inProgress = 0;
    };
}

veUtils.service('HttpService', HttpService);
