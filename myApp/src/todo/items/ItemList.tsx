import React, { useContext, useState } from 'react';
import { IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonList, IonPage, IonTitle, IonToolbar, useIonViewDidEnter, useIonViewWillEnter } from "@ionic/react";
import { RouteComponentProps } from 'react-router';
import { ItemContext } from './ItemProvider';
import { Item } from '../item/Item';
import { add } from 'ionicons/icons';
import { AuthContext } from '../auth/AuthProvider';

const ItemList : React.FC<RouteComponentProps> = ({history}) => {
    const {items,size,fetchData} = useContext(ItemContext);
    const {logout} = useContext(AuthContext);
    const [disabledInfiniteScroll,setDisabledInfiniteScroll] = useState<boolean>(false);

    async function fetchNextData(){
        fetchData && await fetchData().then(result => {
            if (result && result.length > 0) {
                setDisabledInfiniteScroll(result.length < size);
            }else{
                setDisabledInfiniteScroll(true);
            }
        });
        
    }

    async function searchNext($event : CustomEvent<void>){
        console.log('ItemList Component : searchNext');
        await fetchNextData();
        ($event.target as HTMLIonInfiniteScrollElement).complete();
    }
    
    useIonViewDidEnter(async () => {
        console.log('ItemList Component : useIonViewWillEnter');
        await fetchNextData();
    });

    console.log('ItemList Component : return');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle slot='start'>Music Store</IonTitle>
                    <IonButtons slot='end'>
                        <IonButton onClick = {logout}>Logout</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                { items && (
                    <IonList>
                        {
                        items.map( ({id ,title,artist,year,genre,userId}) =>
                            <Item key={id}
                                id = {id} 
                                title = {title} 
                                artist = {artist} 
                                year = {year} 
                                genre = {genre}
                                userId = {userId}
                                onEdit = {id => history.push(`/item/${id}`)}
                            />)
                        }
                    </IonList>                    
                )}
                <IonInfiniteScroll
                    threshold="100px"
                    disabled = {disabledInfiniteScroll} 
                    onIonInfinite = { (e : CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent loadingText="Loading more items..."></IonInfiniteScrollContent>
                </IonInfiniteScroll>                
                <IonFab vertical='bottom' horizontal='end' slot='fixed'>
                    <IonFabButton onClick = { () => history.push('/item') }>
                        <IonIcon icon = { add } />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default ItemList;