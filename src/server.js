let WebSocket = require('ws');
let redis = require('redis');

let wss = new WebSocket.Server({
    port: 3000
});

let client = redis.createClient();

wss.on('connection', function(ws) {
    client.lrange('barrages', 0, -1, function(err, applies) {
        // 由于 redis 的数据都是字符串，所以需要把数组中每一项转成对象
        applies = applies.map(item => JSON.parse(item));
        ws.send(
            JSON.stringify({
                type: 'INIT',
                data: applies
            })
        );
    });

    ws.on('message', function(data) {
        client.rpush('barrages', data, redis.print);
        ws.send(
            JSON.stringify({
                type: 'ADD',
                data: JSON.parse(data)
            })
        );
    });
});