import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { ItemProps } from '../item/ItemProps';
import { addItem, getItems, myWebSocket, updateItem } from '../../common/ItemApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type SaveItemFn = (item : ItemProps) => Promise<any>; 

export interface ItemsState {
    items? : ItemProps[],
    fetching : boolean,
    fetchingError? : Error | null,
    saving : boolean,
    savingError? : Error | null,
    saveItem? : SaveItemFn
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
    savingError : null
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
            return {...state, items : payload.items , fetching : false };
        case FETCH_ITEMS_FAILED:
            toast.error(payload.error.message,{
                position : "top-center",
                autoClose : false
            });
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
                if(!payload.showMessage){
                    toast.success('Save item success',{
                        position : "top-center",
                        autoClose : false
                    });
                }
                
            }else{
                //modificat
                items[index] = item;
                if(!payload.showMessage){
                    toast.success('Update item success',{
                        position : "top-center",
                        autoClose : false
                    });
                }
            }
            if(payload.showMessage){
                toast.info(payload.message,{
                    position : "top-center",
                    autoClose : false
                });
            }
            return {...state, items, saving : false};
        case SAVE_ITEM_FAILED:
            toast.error(payload.error.message,{
                position : "top-center",
                autoClose : false
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
    const [state,dispatch] = useReducer(reducer , initialState);
    const {items, fetching, fetchingError, saving, savingError} = state;
    
    useEffect(getItemsEffect,[]);
    useEffect(wsEffect,[]);

    const saveItem = useCallback<SaveItemFn>(saveItemCallback, []);
    const value = {items,fetching,fetchingError,saving,savingError,saveItem};
    
    console.log('returns');
    return (
        <ItemContext.Provider value={value}>
            {children}
        </ItemContext.Provider>
    );

    function getItemsEffect(){
        console.log('getItemsEffect');
        let canceled = false;
        fetchItems();
        return () => { canceled = true; }

        async function fetchItems() {
            try{
                console.log('fetchItems -> started');
                dispatch({type : FETCH_ITEMS_STARTED});
                const items = await getItems();
                console.log('fetchItems -> succeeded');
                if(!canceled){
                    dispatch({type : FETCH_ITEMS_SUCCEEDED, payload : {items} });
                }
            }catch(error){
                console.log('fetchItems -> failed');
                dispatch({type : FETCH_ITEMS_FAILED, payload : {error} });
            }
        }
    }

    async function saveItemCallback(item : ItemProps){
        try{
            console.log('saveItem -> started');
            dispatch({type : SAVE_ITEM_STARTED});
            if(item.id === 0){
                const savedItem = await updateItem(item);
                console.log('saveItem -> succeeded');
                dispatch({type : SAVE_ITEM_SUCCEEDED, payload : {item : savedItem, showMessage : false} });
            }else{
                const savedItem = await (item.id? updateItem(item) : addItem(item));
                console.log('saveItem -> succeeded');
                dispatch({type : SAVE_ITEM_SUCCEEDED, payload : {item : savedItem, showMessage : false} });
            }
        }catch(error){
            console.log('saveItem -> failed');
            dispatch({type : SAVE_ITEM_FAILED, payload : {error} });
            throw error;
        }
    }

    function wsEffect(){
        let canceled = false;
        console.log('Web Socket connecting...');
        const closeWebSocket = myWebSocket( messageReceived => {
            if(canceled){
                return;
            }

            const {event,message,item} = messageReceived;
            if(event === 'created' || event === 'updated'){
                dispatch({type : SAVE_ITEM_SUCCEEDED, payload : {item : item, message : message, showMessage : true} });
            }
        });

        return () => {
            console.log('Web Socket disconnecting...');
            canceled = true;
            closeWebSocket();
        }
    }

};