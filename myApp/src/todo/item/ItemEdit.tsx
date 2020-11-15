import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import React from "react";
import { useContext, useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import { ItemContext } from "../items/ItemProvider";
import { ItemProps } from "./ItemProps";

interface ItemEditProps extends RouteComponentProps<{
    id? : string;
}>{}

const ItemEdit : React.FC<ItemEditProps> = ({history,match}) => {
    const {items,saving,saveItem} = useContext(ItemContext);
    const [title,setTitle] = useState<string>('');
    const [artist,setArtist] = useState<string>('');
    const [year,setYear] = useState<number>();
    const [genre,setGenre] = useState<string>('');
    const [item,setItem] = useState<ItemProps>();
    var canBack = true;
    useEffect( () => {
        console.log('useEffect');
        var routeId : number;
        if(Number(match.params.id) === undefined){
            routeId = -1;
        }
        else{
            routeId = Number(match.params.id);
        }
        console.log(routeId);
        const item = items?.find(it => it.id === routeId);
        setItem(item);
        if(item){
            setTitle(item.title);
            setArtist(item.artist);
            setYear(item.year);
            setGenre(item.genre);
        }
    },
    [match.params.id,items]
    );

    const handleSave = () => {
        
        if(year === undefined){
            setYear(-1);
        }
        const editedItem = item? {...item,title,artist,year,genre} : {title,artist,year,genre};

        saveItem && saveItem(editedItem).then(() => {
            if(!canBack){
                history.block(false);
                canBack = true;
            }
            history.goBack();
            
        }).catch(err => {
            if(canBack){
                history.block(true);
                canBack = false;
            } 
        });
    }
    console.log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit Item</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick = {handleSave}>Save</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput placeholder="Title" value={title} onIonChange = {e => setTitle(e.detail.value || '')} />
                <IonInput placeholder="Artist" value={artist} onIonChange = {e => setArtist(e.detail.value || '')} />
                <IonInput type = "number" placeholder="Year" value={year} onIonChange = {e => setYear(Number(e.detail.value))} />
                <IonInput placeholder="Genre" value={genre} onIonChange = {e => setGenre(e.detail.value || '')} />
                <IonLoading isOpen = {saving} />
            </IonContent>
        </IonPage>
    );
};

export default ItemEdit;