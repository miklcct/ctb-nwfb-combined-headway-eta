'use strict';

class Stop {
    constructor(/** int */ id, /** ?string */ name, /** ?string */ stand) {
        id = Number(id);
        this.id = id;
        this.name = name;
        this.stand = stand;
        if (name !== null) {
            localStorage[id] = name;
        }
    }
}

Stop.get = function (/** Variant */ variant, /** Function */ callback) {
    Common.callApi(
        'ppstoplist.php'
        , {info : '0|*|' + variant.info.replace(/\*\*\*/g, '||')}
        , function (/** Array */ data) {
            const stops = [];
            data.forEach(
                function (/** Array */ segments) {
                    stops[Number(segments[2])] = new Stop(segments[3], segments[7], segments[4].match(/[a-zA-Z]/).pop());
                }
            );
            callback(stops);
        }
    );
};
