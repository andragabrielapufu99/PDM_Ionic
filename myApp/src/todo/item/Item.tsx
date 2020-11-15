import React from 'react';
import { IonItem, IonLabel } from "@ionic/react";
import { ItemPropsExtended } from './ItemPropsExtended';

export const Item : React.FC<ItemPropsExtended> = ({id,title,artist,year,genre,onEdit}) => {
    return (
        <IonItem onClick = { () =>  onEdit(id) }>
            <IonLabel>{title}</IonLabel>
            <IonLabel>{artist}</IonLabel>
            <IonLabel>{year}</IonLabel>
            <IonLabel>{genre}</IonLabel>
        </IonItem>
    );
};

