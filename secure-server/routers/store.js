const mongoose = require('mongoose');
const Double = require('@mongoosejs/double');
const connectionString = "mongodb+srv://puffy:puffy1999@cluster0.daezy.mongodb.net/MusicStore?retryWrites=true&w=majority";
const Schema = mongoose.Schema;

const User = new Schema({
    firstname : {
        type : String
    },
    lastname : {
        type : String
    },
    username: {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    lastIdFetched : {
        type : Number
    }
});

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
    },
    pathImage : {
        type : String
    },
    latitude : {
        type : Double
    },
    longitude : {
        type : Double
    },
    userId : {
        type : String
    }
});

mongoose.connect(connectionString,{
    useNewUrlParser : true,
    useCreateIndex : true,
    useUnifiedTopology : true
});

mongoose.connection.on('error',console.error.bind(console,'MongoDB connection error : '));

//db models
const Users = mongoose.model('Users',User,'Users');
const Items = mongoose.model('Items',Item,'Items');

var lastId = -1;

const generateId = async() =>{
    if(lastId != -1){
        lastId = lastId + 1;
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
};

const insertItem = async (item) => {
    await generateId();
    item.id = lastId;
    const result = await Items.insertMany(item);
    return result[0];
};

const findItemsByUser = async (userId) => {
    return await Items.find({userId : userId});
};

const updateUser = async (newUser) => {
    return await Users.updateOne({'username' : newUser.username}, newUser);
};

const findItemsByUserSize = async (user,size) => {
    const items = await Items.find({$and : [{userId : user.username}, {id : {$gt : Number(user.lastIdFetched) }}]});
    if(items.length > 0){
        if(items.length > size){
            const res = items.slice(0,size);
            let lastId = res[res.length - 1].id;
            user.lastIdFetched = lastId;
            await updateUser(user);
            return res;
        }else{
            let lastId = items[items.length - 1].id;
            user.lastIdFetched = lastId;
            await updateUser(user);
        }
    }
    return items;
};

const insertUser = async (user) => {
    const result = await Users.insertMany(user);
    return result[0];
};

const findUserByCredentials = async (credentials) => {
    if(credentials.password === undefined){
        return await Users.findOne({username : credentials.username});
    }
    return await Users.findOne({username : credentials.username, password : credentials.password});
};

const findItemById = async (itemId) => {
    return await Items.findOne({id : itemId});
};

const updateItem = async (item) => {
    await Items.updateOne({id : item.id}, item);
    return await Items.findOne({id : item.id});
};

const checkExistsItem = async (item) => {
    return await Items.findOne({userId : item.userId, title : item.title, artist : item.artist});
};

const deleteUser = async (id) => {
    await Items.deleteMany({userId : id});
    return await Users.deleteOne({username : id});
};

const deleteItem = async (id) => {
    return await Items.deleteOne({id : id});
};

const getItemsByUser = async (userId) => {
    return await Items.find({userId : userId});
};

const Store = {
    'findUserByCredentials' : findUserByCredentials,
    'insertUser' : insertUser,
    'updateUser' : updateUser,
    'findItemsByUser' : findItemsByUser,
    'findItemsByUserSize' : findItemsByUserSize,
    'insertItem' : insertItem,
    'findItemById' : findItemById,
    'updateItem' : updateItem,
    'checkExistsItem' : checkExistsItem,
    'deleteUser' : deleteUser,
    'getItemsByUser' : getItemsByUser,
};

module.exports = Store;