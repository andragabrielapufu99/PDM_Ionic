const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../utils/jwtConfig');
const store = require('./store');

//validation imports
const validator = require('../utils/validation');

const router = new Router();

const createToken = (user) => {
    return jwt.sign({ username : user.username, _id: user._id }, jwtConfig.secret, { expiresIn : 60 * 60 * 60 });
};

const saveUser = async (ctx) => {
    const user = ctx.request.body;
    await validator.validateUser(user);
    const foundUser = await store.findUserByCredentials({username : user.username});
    if(foundUser !== null && foundUser !== undefined){
        const err = new Error(`The username ${user.username} already exists!`);
        err.statusCode = 400; //bad request
        throw err;
    }
    const result = await store.insertUser(user);
    ctx.response.body = { token : createToken(result) };
    ctx.response.status = 201; //created
};

const deleteUser = async (ctx) => {
    const id = ctx.params.id;
    const foundUser = await store.findUserByCredentials({username : id});
    if(foundUser === null || foundUser === undefined){
        const err = new Error(`The username ${id} doesn't exists!`);
        err.statusCode = 404; //bad request
        throw err;
    }
    const result = await store.deleteUser(id);
    ctx.response.body = { message : `The user ${id} was deleted succesfull`};
    ctx.response.status = 200; //ok
};

router.post('/register', async(ctx) => {
    await saveUser(ctx);
});

router.post('/login', async(ctx) => {
    const credentials = ctx.request.body;
    await validator.validateCredentials(credentials);
    const user = await store.findUserByCredentials(credentials);
    if(user === null || user === undefined){
        const err = new Error('These credentials are incorrect!');
        err.statusCode = 404; //not found
        throw err;
    }
    ctx.response.body = { token : createToken(user) };
    ctx.response.status = 200; //ok
});

router.delete('/unregister/:id', async(ctx) => {
    await deleteUser(ctx);
});

module.exports = router;