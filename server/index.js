const Koa = require('koa');
const app = new Koa();
const http = require('http');
const server = http.createServer(app.callback());
const WebSocket = require('ws');
const webSocketServer = new WebSocket.Server({server});
const Router = require('koa-router');
const cors = require('koa-cors');
const bodyParser = require('koa-bodyparser');

//database stuff
const mongoose = require('mongoose');
const { exception } = require('console');
const connectionString = "mongodb+srv://puffy:puffy1999@cluster0.daezy.mongodb.net/MusicStore?retryWrites=true&w=majority";
const Schema = mongoose.Schema;

const Item = new Schema({
    id: {
        type : Number,
        required : true
    },
    title : {
        type : String,
        required : true
    },
    artist : {
        type : String,
        required : true
    },
    year : {
        type : Number,
        required : true
    },
    genre : {
        type : String,
        required : true
    }
});

//db connect
mongoose.connect(connectionString,{
    useNewUrlParser : true,
    useCreateIndex : true,
    useUnifiedTopology : true
});
mongoose.connection.on('error',console.error.bind(console,'MongoDB connection error : '));

//db model
const Items = mongoose.model('Items',Item,'Items');

app.use(bodyParser());
app.use(cors());

var lastId = -1;

app.use(async(ctx,next) => {
    try{
        await next();
    }catch(err){
        ctx.response.body = {message : err.message || 'Unexpected error'};
        ctx.response.status = 500;
    }
});

const router = new Router();

const broadcast = data => {
    webSocketServer.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify(data));
        }
    });
};

router.get('/api/items', async(ctx) => {
    console.log("GET /api/items");
    const items = await Items.find({});
    ctx.response.body = items;
    ctx.response.status = 200;
});

router.get('/api/items/:id', async(ctx) => {
    const itemId = ctx.params.id;
    console.log(`GET /api/items/${itemId}`);
    const item = await Items.findOne({'id' : itemId});
    if(item == null){
        ctx.response.body = { message : `Item with id ${itemId} was not found`};
        ctx.response.status = 404; //NOT FOUND
        return;
    }
    ctx.response.body = JSON.stringify(item);
    ctx.response.status = 200; //OK
});

async function generateId(){
    if(lastId != -1){
        lastId = lastId +1;
    }
    else{
        //we have no item or server is start for the first time
        const result = await Items.find({});
        if(result.length == 0){
            lastId = 0;
        }else{
            lastId = result[result.length-1]['id'];
            lastId = lastId + 1;
        }
    }
}

 async function addItem(ctx,item){
    await generateId();
    var validItem = {};
    validItem['id'] = lastId;
    validItem['title'] = item.title;
    validItem['artist'] = item.artist;
    validItem['year'] = item.year;
    validItem['genre'] = item.genre;

    const result = await Items.insertMany(validItem);
    ctx.response.body = JSON.stringify(result[0]);
    ctx.response.status = 201;
    broadcast({event : 'created', message : `A new item was added to list.`, item : result[0]});
 }

router.post('/api/items',async(ctx) => {
    console.log("POST /api/items");
    const item = ctx.request.body;
    
    //validare
    var errors = "";
    
    if(!item.title){
        errors += "Title is missing!\n";
    }

    if(!item.artist){
        errors += "Artist is missing!\n";
    }
    
    if(parseInt(item.year) < 0){
        errors += "Year is a negative number!\n";
    }
    
    if(!item.genre){
        errors += "Genre is missing!\n";
    }
    
    if(errors != ""){
        ctx.response.body = { message : errors};
        ctx.response.status = 400; //BAD REQUEST
        return;
    }

    const result = await Items.find({'title':item.title,'artist':item.artist});
    if(result.length > 0){
        ctx.response.body = {message : 'This item was already inserted!'};
        ctx.response.status = 400; //BAD REQUEST
        return;
    }
    await addItem(ctx,item);

});

router.put('/api/items/:id',async(ctx) => {
    
    const idSearched = ctx.params.id;
    console.log(`PUT /api/items/${idSearched}`);
    
    const item = ctx.request.body;
    
    //validare
    var errors = "";
    
    if(item.id != idSearched){
        errors += "Id from URL parameters should be the same with item's id!\n";
    }

    if(!item.title){
        errors += "Title is missing!\n";
    }

    if(!item.artist){
        errors += "Artist is missing!\n";
    }
    
    if(parseInt(item.year) < 0){
        errors += "Year is a negative number!\n";
    }
    
    if(!item.genre){
        errors += "Genre is missing!\n";
    }

    if(errors != ""){
        ctx.response.body = { message : errors};
        ctx.response.status = 400; //BAD REQUEST
        return;
    }

    const updatedItem = await Items.updateOne({'id' : idSearched},item);
    if(updatedItem['n'] == 0){
        //item doesn't exist
        ctx.response.body = { error : `Item with id ${idSearched} was not found!` };
        ctx.response.status = 404; //NOT FOUND
        return;
    }
    ctx.response.body = JSON.stringify(item);
    ctx.response.status = 200; //OK
    broadcast({event : 'updated', message : `The item with id ${idSearched} was updated.`, item : item});
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = 3000;
server.listen(port,()=>console.log(`Server listen on port ${port}`));