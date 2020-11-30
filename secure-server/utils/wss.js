const jwt = require('jsonwebtoken');
const jwtConfig = require('./jwtConfig');
const WebSocket = require('ws');

let wss;

const initWss = value => {
    wss = value;
    wss.on('connection', ws => {
        ws.on('message', msgReceived => {
            const { type, payload : {token} } = JSON.parse(msgReceived);
            if(type !== 'authorization'){
                ws.close();
                return;
            }
            try{
                ws.user = jwt.verify(token, jwtConfig.secret);              
            }catch(err){
                ws.close();
            }
        });
    });
};

const broadcast = (userId, data) => {
    if(!wss){
        return;
    }
    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN && userId === client.user.username){
            client.send(JSON.stringify(data));
        }
    });
};

const WebSocketUtils = {
    'initWss' : initWss,
    'broadcast' : broadcast
}
module.exports = WebSocketUtils;