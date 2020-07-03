'use strict';

const Common = {
    PROXY_URL : 'https://miklcct.com/proxy/',
    SECRET_URL : 'https://miklcct.com/NwfbSecret.json',
    BASE_URLS : [
        'https://mobile01.nwstbus.com.hk/api6/',
        'https://mobile02.nwstbus.com.hk/api6/',
        'https://mobile03.nwstbus.com.hk/api6/',
        'https://mobile04.nwstbus.com.hk/api6/',
        'https://mobile05.nwstbus.com.hk/api6/',
        'https://mobile06.nwstbus.com.hk/api6/',
    ],

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
                data.split('<br>').filter(
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
     */
    callApi : function (file, query, callback, preprocess) {
        if (Common.secret === null) {
            $.get(
                Common.SECRET_URL
                , {}
                , function (json) {
                    Common.secret = json;
                    Common.callApi(file, query, callback, preprocess);
                }
            )
        } else {
            $.get(
                Common.PROXY_URL + Common.BASE_URLS[Math.floor(Math.random() * Common.BASE_URLS.length)] + file
                , Object.assign(
                    Object.assign(
                        {
                            p : 'android',
                            l : 1,
                            ui_v2 : 'Y',
                        }
                        , Common.secret
                    )
                    , query
                )
                , function (data) {
                    if (data === '') {
                        Common.callApi(file, query, callback, preprocess);
                    } else {
                        Common.getCallbackForMobileApi(callback, preprocess)(data);
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

    secret : null,
};