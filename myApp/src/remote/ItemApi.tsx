import axios from 'axios';
import {ItemProps} from '../todo/item/ItemProps';
import { baseURL, prefix,withLogs,authConfig } from '../common/index';

const itemsURL = `http://${baseURL}${prefix}/items`;

export const getItems : (token : string) => Promise<ItemProps[]> = (token) => {
    return withLogs(axios.get(`${itemsURL}`,authConfig(token)),'getItems');
}

export const addItem : (token : string, item : ItemProps) => Promise<ItemProps> = (token, item) => {
    return withLogs(axios.post(`${itemsURL}`,item,authConfig(token)),'addItem');
}

export const updateItem : (token : string, item : ItemProps) => Promise<ItemProps> = (token, item) => {
    return withLogs(axios.put(`${itemsURL}/${item.id}`,item,authConfig(token)),'updateItem');
}

interface MessageData {
    event : string;
    payload : ItemProps;
}

export const myWebSocket = (token : string, onMessage : (data : MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseURL}`);
    ws.onopen = () => {
        console.log('Web Socket on open method');
        ws.send(JSON.stringify({type : 'authorization', payload : { token } }));
    };
    ws.onclose = () => {
        console.log('Web Socket on close method');
    };
    ws.onerror = error => {
        console.error('Error Web Socket : ',error);
    };
    ws.onmessage = messageEvent => {
        console.log('Web Socket on message method');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}