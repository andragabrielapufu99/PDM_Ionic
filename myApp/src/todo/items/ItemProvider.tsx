import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { ItemProps } from '../item/ItemProps';
import { addItem, getItems, myWebSocket, updateItem } from '../../remote/ItemApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext, AuthState } from '../auth/AuthProvider';
import { Redirect } from 'react-router';

type SaveItemFn = (item : ItemProps) => Promise<any>; 

export interface ItemsState {
    items? : ItemProps[],
    fetching : boolean,
    fetchingError? : Error | null,
    saving : boolean,
    savingError? : Error | null,
    saveItem? : SaveItemFn,
}

interface ActionProps {
    type : string,
    payload? : any
}

const initialState : ItemsState = {
    fetching : false,
    saving : false,
    items : [],
    saveItem : undefined,
    fetchingError : null,
    savingError : null,
}

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';

const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';

const reducer : (state : ItemsState, action : ActionProps) => ItemsState = (state,{type,payload}) => {
    toast.configure();
    switch(type){
        case FETCH_ITEMS_STARTED:
            return {...state, fetching : true, fetchingError : null };
        case FETCH_ITEMS_SUCCEEDED:
            localStorage.setItem('items',payload.items);
            return {...state, items : payload.items , fetching : false };
        case FETCH_ITEMS_FAILED:
            console.log(`Err : ${payload.error}`);
            toast.error(payload.error,{
                position : "top-center",
                autoClose : 5000
            });
            let storageData = localStorage.getItem('items');
            console.log(`Storage data : ${JSON.stringify(storageData)}`);
            if(storageData !== null){
                return {...state, items : JSON.parse(storageData), fetchingError : payload.error, fetching : false };
            }
            return {...state, fetchingError : payload.error, fetching : false };
        case SAVE_ITEM_STARTED:
            return {...state, saving : true, savingError : null };
        case SAVE_ITEM_SUCCEEDED:
            const items = [...(state.items || [])];
            const item = payload.item;
            const index = items.findIndex(it => it.id === item.id);
            if(index === -1){
                //creat
                items.splice(0,0,item);
                toast.success('Save item success',{
                    position : "top-center",
                    autoClose : 5000
                });
                
            }else{
                //modificat
                items[index] = item;
                toast.success('Update item success',{
                    position : "top-center",
                    autoClose : 5000
                });
            }
            return {...state, items, saving : false};
        case SAVE_ITEM_FAILED:
            toast.error(payload.error,{
                position : "top-center",
                autoClose : 5000
            });
            return {...state, savingError : payload.error, saving : false }
        default:
            return state;
    }   
};

export const ItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
    children : PropTypes.ReactNodeLike
}

export const ItemProvider : React.FC<ItemProviderProps> = ({children}) => {
    const { token } = useContext<AuthState>(AuthContext); //obtains token
    const [state,dispatch] = useReducer(reducer , initialState);
    const {items, fetching, fetchingError, saving, savingError} = state;

    useEffect( () => {
        console.log('getItemsEffect');
        let canceled = false;
        fetchItems();
        return () => { canceled = true; }

        async function fetchItems() {
            if(!token?.trim()){
                return;
            }
            try{
                console.log('fetchItems -> started');
                dispatch({type : FETCH_ITEMS_STARTED});
                const items = await getItems(token);
                console.log('fetchItems -> succeeded');
                if(!canceled){
                    dispatch({type : FETCH_ITEMS_SUCCEEDED, payload : {items} });
                }
            }catch(error){
                console.log('fetchItems -> failed');
                dispatch({type : FETCH_ITEMS_FAILED, payload : {error} });
            }
        }
    },[token]);

    useEffect( () => {
        //websocket effects
        let canceled = false;
        console.log('Web Socket connecting...');
        let closeWebSocket: () => void;
        if(token?.trim()){
            closeWebSocket = myWebSocket( token,messageReceived => {
                if(canceled){
                    return;
                }
                const {event,payload} = messageReceived;
                console.log(`Web Socket Event : ${event}`);
                if(event === 'created' || event === 'updated'){
                    console.log(`Web Socket Item : ${payload}`);
                    dispatch({type : SAVE_ITEM_SUCCEEDED, payload : {item : payload} });
                }
            });
        }
        
        return () => {
            console.log('Web Socket disconnecting...');
            canceled = true;
            closeWebSocket?.();
        }
    },[token]);
    const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
    const value = {items,fetching,fetchingError,saving,savingError,saveItem};
    
    console.log('return ItemProvider');
    return (
        <ItemContext.Provider value={value}>
            {children}
        </ItemContext.Provider>
    );


    async function saveItemCallback(item : ItemProps){
        if(!token?.trim()){
            return;
        }
        try{
            console.log('saveUpdateItem -> started');
            console.log(`Item to save : ${JSON.stringify(item)}`);
            dispatch({type : SAVE_ITEM_STARTED});
            console.log(`Item id : ${item.id}`);
            if(item.id === undefined){
                await addItem(token,item);
            }else{
                await updateItem(token,item);
            }
            console.log('saveUpdateItem -> succeeded');
        }catch(error){
            console.log('saveUpdateItem -> failed');
            dispatch({type : SAVE_ITEM_FAILED, payload : {error} });
            throw error;
        }
    }

};