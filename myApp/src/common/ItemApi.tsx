import axios from 'axios';
import {ItemProps} from '../todo/item/ItemProps';

interface Response<T> {
    data : T;
}

const URL = "http://localhost:3000/api";

function withLogs<T>(promise : Promise<Response<T>>, fnName : string) : Promise<T> {
    console.log(`${fnName} -> started`);
    return promise
        .then(res => {
            console.log(`${fnName} -> succeeded`);
            return Promise.resolve(res.data);
        })
        .catch(err => {
            console.log(`${fnName} -> failed`);
            //console.log(JSON.stringify();
            return Promise.reject(err.response.data);
        });
}

const config = {
    headers : {
        'Content-Type' : 'application/json',
        'Accept' : 'application/json'
    }
}

export const getItems : () => Promise<ItemProps[]> = () => {
    return withLogs(axios.get(`${URL}/items`,config),'getItems');
}

export const getItem : ( id : number) => Promise<ItemProps> = id => {
    return withLogs(axios.get(`${URL}/items/${id}`,config),'getItem');
}

export const addItem : ( item : ItemProps) => Promise<ItemProps> = item => {
    return withLogs(axios.post(`${URL}/items`,item,config),'addItem');
}

export const updateItem : (item : ItemProps) => Promise<ItemProps> = item => {
    return withLogs(axios.put(`${URL}/items/${item.id}`,item,config),'updateItem');
}

interface MessageData {
    event : string;
    message : string;
    item : ItemProps;
}

export const myWebSocket = (onMessage : (data : MessageData) => void) => {
    const ws = new WebSocket(`ws://localhost:3000`);
    ws.onopen = () => {
        console.log('Web Socket on open method');
    }
    ws.onclose = () => {
        console.log('Web Socket on close method');
    }
    ws.onerror = error => {
        console.error('Error Web Socket : ',error);
    }
    ws.onmessage = messageEvent => {
        console.log('Web Socket on message method');
        onMessage(JSON.parse(messageEvent.data));
    }
    return () => {
        ws.close();
    }
}