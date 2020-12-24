import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { ItemProps } from '../item/ItemProps';
import { addItem, getItems, myWebSocket, updateItem } from '../../remote/ItemApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext, AuthState } from '../auth/AuthProvider';

type SaveItemFn = (item : ItemProps) => Promise<any>; 
type FetchItemFn = () => Promise<ItemProps[]>;

export interface ItemsState {
    items : ItemProps[],
    fetching: boolean,
    fetchingError? : Error | null,
    saving : boolean,
    savingError? : Error | null,
    saveItem? : SaveItemFn,
    lastFetchId : Number,
    size : Number,
    fetchData? : FetchItemFn,
}

interface ActionProps {
    type : string,
    payload? : any
}

const initialState : ItemsState = {
    saving : false,
    fetching : false,
    items : [],
    saveItem : undefined,
    fetchingError : null,
    savingError : null,
    lastFetchId : -1,
    size : 7,
    fetchData : undefined,
}

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const FETCH_ITEMS_SCROLL = 'FETCH_ITEMS_SCROLL';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';

const reducer : (state : ItemsState, action : ActionProps) => ItemsState = (state,{type,payload}) => {
    toast.configure();
    switch(type){
        case FETCH_ITEMS_STARTED:
            return {...state,fetching : true}; 
        case FETCH_ITEMS_FAILED:
            let storageData = localStorage.getItem('items');
            if(storageData !== null){
                return {...state, items : JSON.parse(storageData), fetchingError : payload.error, fetching : false};
            }
            return {...state, fetchingError : payload.error, fetching : false};  
        case FETCH_ITEMS_SCROLL:
            let itemsReceived = payload.result;
            let lastId : Number = state.lastFetchId;
            if(itemsReceived.length > 0){
                lastId = Number(itemsReceived[itemsReceived.length-1].id);
            }
            if(state.items.length === 0 && itemsReceived.length === 0){
                const items_store = localStorage.getItem('items');
                if(items_store !== null){
                    return {...state, items: JSON.parse(items_store)};
                }
            }
            const containsId = (i : ItemProps) : boolean => i.id === lastId;
            let isRepeat  = state.items.some(containsId);
            if(isRepeat){
                //return state;
            }
            let newsItems : ItemProps[] = [];
            newsItems = [...(state.items || []),...itemsReceived];
            localStorage.setItem('items',JSON.stringify(newsItems));
            return {...state,items : newsItems, lastFetchId : lastId,fetching : false};
            
        case SAVE_ITEM_STARTED:
            return {...state, saving : true, savingError : null };
        case SAVE_ITEM_SUCCEEDED:
            const items = [...(state.items || [])];
            const item = payload.item;
            const index = items.findIndex(it => it.id === item.id);
            if(index === -1){
                //creat
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
    const {items, fetching, fetchingError, saving, savingError, lastFetchId, size} = state;

    async function addItemsCallback() : Promise<ItemProps[]>{
        let result : ItemProps[] = [];
        if(token.trim()){
            try{
                result = await getItems(token,size);
                dispatch({type : FETCH_ITEMS_SCROLL, payload : {result}});
            }catch(err){
                dispatch({type : FETCH_ITEMS_FAILED, payload : {err}})
            }
        }else{
            dispatch({type : FETCH_ITEMS_FAILED, payload : {err: "Invalid token"}});
        }
        return result;
    }

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
    const fetchData = useCallback<FetchItemFn>(addItemsCallback,[token,fetching,size,lastFetchId]);

    const value = {
        items,
        fetching,
        fetchingError,
        saving,
        savingError,
        saveItem,
        lastFetchId,
        size,
        fetchData,
    };
    
    console.log('ItemProvider : return');
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

            console.log('ItemProvider : saveUpdateItem -> started');
            dispatch({type : SAVE_ITEM_STARTED});
            if(item.id === undefined){
                await addItem(token,item);
            }else{
                await updateItem(token,item);
            }
            console.log('ItemProvider : saveUpdateItem -> succeeded');
        }catch(error){
            console.log('ItemProvider : saveUpdateItem -> failed');
            dispatch({type : SAVE_ITEM_FAILED, payload : {error} });
            throw error;
        }
    }

};