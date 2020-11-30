const exceptionHandler = async (ctx, next) => {
    try{
        return await next();
    }catch(err){
        ctx.response.body = err.message || 'Unexpected error';
        ctx.response.status = err.statusCode || 500;
    }
};

const timmingLogger = async (ctx, next) => {
    const start = Date.now();
    await next(); //wait for end other functions
    console.log(`${ctx.method} ${ctx.url} => ${ctx.response.status}, ${Date.now() - start}ms`);
}

const Middlewares = {
    'exceptionHandler' : exceptionHandler,
    'timmingLogger' : timmingLogger
};

module.exports = Middlewares;