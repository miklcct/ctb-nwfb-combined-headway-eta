'use strict';

const Common = {
    PROXY_URLS : ['https://miklcct.com/proxy/', 'https://cors-anywhere.herokuapp.com/'],
    SECRET_URL : 'https://miklcct.com/NwfbSecret.json',
    BASE_URLS : [
        'https://mobile01.nwstbus.com.hk/api6/',
        'https://mobile02.nwstbus.com.hk/api6/',
        'https://mobile03.nwstbus.com.hk/api6/',
        'https://mobile04.nwstbus.com.hk/api6/',
        'https://mobile05.nwstbus.com.hk/api6/',
        'https://mobile06.nwstbus.com.hk/api6/',
    ],
    MAX_RETRY_COUNT : 5,

    /**
     * Get a callback for AJAX to call the NWFB mobile API and process through handler
     *
     * @param {function(!Array<!Array<string>>)} handler The handler for tokenised data
     * @param {function(string)=} preprocess If specified, preprocess the returned string before tokenising it
     * @return {function(string)}
     */
    getCallbackForMobileApi : function (handler, preprocess) {
        /**
         * @return {function(string)}
         */
        return function (data) {
            if (preprocess !== undefined) {
                data = preprocess(data);
            }
            handler(
                data.trim().split('<br>').filter(
                    function (line) {
                        return line !== '';
                    }
                ).map(
                    function (line) {
                        return line.split('||').map(s => s.replace(/^\|+|\|+$/g, ''));
                    }
                )
            );
        };
    },

    /**
     * Call the NWFB mobile API
     *
     * @param {string} file The file name of the API endpoint to be called, the directory is added automatically
     * @param {Object<string, string>} query The query string parameters, except the common "syscode" and "l"
     * @param {function(!Array<!Array<string>>)} callback The handler for tokenised data
     * @param {function(string)=} preprocess If specified, preprocess the returned string before tokenising it
     * @param {int|undefined} retry_count
     */
    callApi : function (file, query, callback, preprocess, retry_count) {
        if (retry_count === undefined) retry_count = 0;
        if (retry_count === Common.MAX_RETRY_COUNT) {
            return;
        }
        if (Common.secret === null) {
            $.get(
                Common.SECRET_URL
                , {}
                , function (json) {
                    Common.secret = json;
                    Common.callApi(file, query, callback, preprocess, retry_count);
                }
            )
        } else {
            let processed = false;
            const retry = () => {
                Common.callApi(
                    file
                    , query
                    , result => {
                        if (!processed) {
                            processed = true;
                            callback(result);
                        }
                    }
                    , preprocess
                    , retry_count + 1
                );
            }
            Common.PROXY_URLS.forEach(
                function (proxy_url) {
                    if (!processed) {
                        // noinspection JSUnusedGlobalSymbols
                        $.get(
                            {
                                url : proxy_url + Common.BASE_URLS[Math.floor(Math.random() * Common.BASE_URLS.length)] + file,
                                data : Object.assign(
                                    Object.assign(
                                        {
                                            p : 'android',
                                            l : Common.getLanguageCode(),
                                            ui_v2 : 'Y',
                                            version : '4.1.2',
                                            version2 : '65',
                                        }
                                        , Common.secret
                                    )
                                    , query
                                ),
                                success : function (data) {
                                    if (data === '') {
                                        retry();
                                    }
                                    if (!processed) {
                                        processed = true;
                                        Common.getCallbackForMobileApi(callback, preprocess)(data);
                                    }
                                },
                                error : retry
                            }
                        );
                    }
                }
            );
        }
    },
    /**
     * Get the stop ID in the query string
     * @return {?int}
     */
    getQueryStopId : function () {
        const stop_id = (new URLSearchParams(window.location.search)).get('stop');
        return stop_id === null ? null : Number(stop_id);
    },
    /**
     * Get the selected route IDs and stop positions in the query string
     * @return {Array<Array<string|int>>}
     */
    getQuerySelections : function () {
        return (new URLSearchParams(window.location.search)).getAll('selections').map(
            function (/** String */ item) {
                const segments = item.split(':');
                return [segments[0], segments.length >= 2 ? Number(segments[1]) : null];
            }
        );
    },

    /**
     * Get if "one departure" mode is selected
     * @return {boolean}
     */
    getQueryOneDeparture : function () {
        return Boolean((new URLSearchParams(window.location.search)).get('one_departure'));
    },

    /**
     * Get the language used in the document
     * @returns {string}
     */
    getLanguage() {
        return $('html').attr('lang');
    },

    /**
     * Get the language code used to query the API
     * @return {int}
     */
    getLanguageCode() {
        const mappings = {
            'zh-hant' : 0,
            'en' : 1,
            'zh-hans' : 2,
        }
        return mappings[Common.getLanguage()];
    },

    secret : null,
};
