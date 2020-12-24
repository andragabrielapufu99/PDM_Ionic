const Router = require('koa-router');
const validator = require('../utils/validation');
const store = require('./store');
const wss = require('../utils/wss');
const router = new Router();

const convertItem = async (itemBd) => {
    var item = {}
    item['id'] = itemBd.id;
    item['title'] = itemBd.title;
    item['artist'] = itemBd.artist;
    item['year'] = itemBd.year;
    item['genre'] = itemBd.genre;
    item['userId'] = itemBd.userId;
    return item;
};

const getItemsByUser = async (ctx) => {
    const userId = ctx.state.user.username;
    const foundUser = await store.findUserByCredentials({username : userId});
    if(foundUser === null && foundUser === undefined){
        const err = new Error("This username doesn't exist!");
        err.statusCode = 404; //not found
        throw err;
    }
    const items = await store.findItemsByUser(userId);
    ctx.response.body = items;
    ctx.response.status = 200; //ok
};

const getItemsByUserSize = async (ctx) => {
    const userId = ctx.state.user.username;
    const foundUser = await store.findUserByCredentials({username : userId});
    if(foundUser === null && foundUser === undefined){
        const err = new Error("This username doesn't exist!");
        err.statusCode = 404; //not found
        throw err;
    }
    const size = ctx.params.size;
    await validator.validateSize(size);
    const items = await store.findItemsByUserSize(foundUser, Number(size));
    ctx.response.body = items;
    ctx.response.status = 200; //ok
    
};

const saveItem = async (ctx) => {
    const userId = ctx.state.user.username;
    const item = ctx.request.body;
    const foundUser = await store.findUserByCredentials({username : userId});
    if(foundUser === null && foundUser === undefined){
        const err = new Error("This username doesn't exist!");
        err.statusCode = 404; //not found
        throw err;
    }
    item.userId = userId;
    await validator.validateItem(item);
    const foundItem = await store.checkExistsItem(item);
    if(foundItem !== null && foundItem !== undefined){
        const err = new Error(`The item with title ${item.title} and artist ${item.artist} already exists for user ${item.userId}!`);
        err.statusCode = 400; //bad request
        throw err;
    }
    let result = await store.insertItem(item);
    result = await convertItem(result);
    ctx.response.body = { item : result };
    ctx.response.status = 201; //created
    wss.broadcast(userId,{ event : 'created', payload : result});
};

const updateItem = async (ctx) => {
    const userId = ctx.state.user.username;
    const itemId = parseInt(ctx.params.itemId);
    const item = ctx.request.body;
    if(item.userId !== userId){
        const err = new Error('User not allowed!');
        err.statusCode = 403; //forbidden
        throw err;
    }
    const foundUser = await store.findUserByCredentials({username : userId});
    if(foundUser === null || foundUser === undefined){
        const err = new Error(`The user with id ${userId} cannot be found!`);
        err.statusCode = 404; //not found
        throw err;
    }
    if(item.id !== itemId){
        const err = new Error(`The itemId from url should be the same with itemId from item!`);
        err.statusCode = 403; //forbidden
        throw err;
    }
    const foundItem = await store.findItemById(item.id);
    if(foundItem === null || foundItem === undefined){
        const err = new Error(`The item with id ${itemid} cannot be found!`);
        err.statusCode = 404; //not found
        throw err;
    }
    if(foundItem.userId !== userId){
        const err = new Error(`The item with id ${itemId} doesn't exists for user ${userId}!`);
        err.statusCode = 400; //bad request
        throw err;
    }

    await validator.validateItem(item);
    let updatedItem = await store.updateItem(item);
    updatedItem = await convertItem(updatedItem);
    ctx.response.body = { item : updatedItem };
    ctx.response.status = 200; //ok
    wss.broadcast(userId,{ event : 'updated', payload : updatedItem});
};

const deleteItem = async (ctx) => {
    const userId = ctx.state.user.username;
    const itemId = ctx.params.itemId;
    const item = await store.findItemById(itemId);
    if(item === null || item === undefined){
        const err = new Error(`The item with id ${itemid} cannot be found!`);
        err.statusCode = 404; //not found
        throw err;
    }
    if(item.userId !== userId){
        const err = new Error(`User not allowed!`);
        err.statusCode = 403; //forbidden
        throw err;
    }
    const result = await store.deleteItem(itemId);
    ctx.response.body = { message : `The item with id ${itemId} was deleted successfull!`};
    ctx.response.status = 200;
};

router.get('/', async(ctx) => {
    await getItemsByUser(ctx);
});

router.get('/fetch/:size', async(ctx) => {
    await getItemsByUserSize(ctx);
});

router.post('/',async (ctx) => {
    await saveItem(ctx);
});

router.put('/:itemId', async(ctx) => {
    await updateItem(ctx);
});

router.delete('/:itemId', async (ctx) => {
    await deleteItem(ctx);
});

module.exports = router;