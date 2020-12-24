const validator = require('validator');

const validateString = async(value,name) => {
    if(validator.isEmpty(value)){
        const err = new Error(`${name} field cannot be empty!`);
        err.statusCode = 400; //bad request
        throw err;
    }
    const blackList = ['/','?',',','|',':'];
    var str = '';
    blackList.forEach(s => str += ' '+s);
    str+=' '+'\\';
    const val = validator.blacklist(value,blackList);
    if(value !== val || val.includes('\\')){
        const err = new Error(`${name} field cannot contains the next characters ${str}`);
        err.statusCode = 400; //bad request
        throw err;
    }
};

const validateUser = async (user) => {
    await validateString(user.firstname,'Firstname');
    await validateString(user.lastname,'Lastname');
    await validateString(user.username,'Username');
    await validateString(user.password,'Password');
};

const validateCredentials = async (credentials) => {
    await validateString(credentials.username,'Username');
    await validateString(credentials.password,'Password');
};

const validateItem = async (item) => {
    await validateString(item.title,'Title');
    await validateString(item.artist,'Artist');
    await validateString(item.genre,'Genre');
    await validateString(item.userId,'Username');
    if(typeof item.year === 'string' && !validator.isInt(item.year,{min:1000,max:9999})){
        const err = new Error('Year must be a positive number of 4 digits!'); //bad request
        err.statusCode = 400;
        throw err;
    }
    if(!(item.year>=1000 && item.year<=9999)){
        const err = new Error('Year must be a positive number of 4 digits!'); //bad request
        err.statusCode = 400;
        throw err;
    }
};

const validateSize = async (size) => {
    if(typeof size === 'string' && !validator.isInt(size)){
        const err = new Error('Size must be a pozitive number!'); //bad request
        err.statusCode = 400;
        throw err;
    }

    if(Number(size) <= 0){
        const err = new Error('Size must be a pozitive number!'); //bad request
        err.statusCode = 400;
        throw err;
    }
}

module.exports = {
    'validateUser' : validateUser, 
    'validateCredentials' : validateCredentials, 
    'validateItem' : validateItem,
    'validateSize' : validateSize,
};