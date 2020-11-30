const Koa = require('koa');
const WebSocket = require('ws');
const http = require('http');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const jwtConfig = require('./utils/jwtConfig');
const webSocketUtils = require('./utils/wss');
const middlewares = require('./utils/middlewares');

//routers imports
const authRouter = require('./routers/users');
const itemsRouter = require('./routers/items');

const jwt = require('koa-jwt');
const cors = require('koa-cors');

const app = new Koa();
const server = http.createServer(app.callback());
const wss = new WebSocket.Server({ server });
webSocketUtils.initWss(wss);

app.use(cors());
app.use(middlewares.timmingLogger);
app.use(middlewares.exceptionHandler);
app.use(bodyParser());

const prefix = '/api';

//public router
const publicApiRouter = new Router({ prefix });
publicApiRouter.use('/auth',authRouter.routes());
app
    .use(publicApiRouter.routes())
    .use(publicApiRouter.allowedMethods());

app.use(jwt(jwtConfig));

//protected router
const protectedApiRouter = new Router({ prefix });
protectedApiRouter.use('/items',itemsRouter.routes());
app
    .use(protectedApiRouter.routes())
    .use(protectedApiRouter.allowedMethods());

const port = 3000;
server.listen(port, () => console.log(`Server listen on port ${port}...`));

