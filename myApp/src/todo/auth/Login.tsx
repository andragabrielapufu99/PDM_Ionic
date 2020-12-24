import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import React from "react";
import { useContext, useState } from "react";
import { Redirect, RouteComponentProps } from "react-router";
import { AuthContext } from "./AuthProvider";

interface LoginState {
    username? : string;
    password? : string;
}

export const Login : React.FC<RouteComponentProps> = ({history}) => {
    const { isAuthenticated, isAuthenticating, login } = useContext(AuthContext);
    const [state,setState] = useState<LoginState>({});
    const { username, password } = state;

    const handleLogin = async () => {
        await login?.(username,password);
    };

    if(isAuthenticated){
        console.log('LoginComponent : redirect /');
        return <Redirect to = {{pathname : '/'}} />
    }

    console.log('LoginComponent : return');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Sign in</IonTitle>
                    <IonButtons slot='end'>
                        <IonButton onClick = { handleLogin }>Login</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput
                    placeholder = "Username"
                    value = { username }
                    onIonChange = { e => setState({
                        ...state,
                        username : e.detail.value || ''
                    })}
                />
                <IonInput
                    placeholder = "Password"
                    value = { password }
                    type = "password"
                    onIonChange = { e => setState({
                        ...state,
                        password : e.detail.value || ''                        
                    })}
                />
                <IonLoading isOpen = { isAuthenticating } />
            </IonContent>
        </IonPage>
    );
};