export interface Response<T> {
    data : T;
}

export const baseURL = "localhost:3000";
export const prefix = "/api";

export function withLogs<T>(promise : Promise<Response<T>>, fnName : string) : Promise<T> {
    console.log(`${fnName} -> started`);
    return promise
        .then(res => {
            console.log(`${fnName} -> succeeded`);
            return Promise.resolve(res.data);
        })
        .catch(err => {
            console.log(`${fnName} -> failed`);
            return Promise.reject(err.response.data);
        });
}

export const config = {
    headers : {
        'Content-Type' : 'application/json',
        'Accept' : 'application/json',
    }
}

export const authConfig = (token? : string) => ({
    headers : {
        'Content-Type' : 'application/json',
        'Accept' : 'application/json',
        'Authorization' : `Bearer ${token}`,
    }
});