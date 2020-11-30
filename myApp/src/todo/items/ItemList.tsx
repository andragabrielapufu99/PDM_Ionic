import React, { useContext } from 'react';
import { IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonList, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { RouteComponentProps } from 'react-router';
import { ItemContext } from './ItemProvider';
import { Item } from '../item/Item';
import { add } from 'ionicons/icons';
import { AuthContext } from '../auth/AuthProvider';

const ItemList : React.FC<RouteComponentProps> = ({history}) => {
    const {items,fetching} = useContext(ItemContext);
    const {logout} = useContext(AuthContext);
    console.log('render ItemList');
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
            <IonContent>
                <IonLoading isOpen = {fetching} message="Fetching items..."/>
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