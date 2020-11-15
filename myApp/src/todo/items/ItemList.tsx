import React, { useContext } from 'react';
import { IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonList, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { RouteComponentProps } from 'react-router';
import { ItemContext } from './ItemProvider';
import { Item } from '../item/Item';
import { add } from 'ionicons/icons';

const ItemList : React.FC<RouteComponentProps> = ({history}) => {
    const {items,fetching} = useContext(ItemContext);
    console.log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Music Store</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen = {fetching} message="Fetching items..."/>
                { items && (
                    <IonList>
                        {
                        items.map( ({id ,title,artist,year,genre}) =>
                            <Item key = {id} 
                                id = {id} 
                                title = {title} 
                                artist = {artist} 
                                year = {year} 
                                genre = {genre}
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