import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {login as loginApi} from '../../remote/AuthApi';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Redirect } from "react-router-dom";

type LoginFn = (username? : string, password? : string) => void;
type LogoutFn = () => void;

export interface AuthState {
    token : string;
    username? : string;
    password? : string;
    isAuthenticated : boolean;
    isAuthenticating : boolean;
    pendingAuthenticating? : boolean;
    authenticationError : Error | null;
    login? : LoginFn;
    logout? : LogoutFn;
}

const initialState : AuthState = {
    token : '',
    isAuthenticated : false,
    isAuthenticating : false,
    pendingAuthenticating : false,
    authenticationError : null,
};

export const AuthContext = React.createContext<AuthState>(initialState);

interface AuthProviderProps {
    children : PropTypes.ReactNodeLike,
}

export const AuthProvider : React.FC<AuthProviderProps> = ({children}) => {
    toast.configure();
    const [state,setState] = useState<AuthState>(initialState);
    const { isAuthenticated, isAuthenticating, pendingAuthenticating, authenticationError, token,username,password} = state;

    const login = useCallback<LoginFn>(loginCallback,[]);
    const logout = useCallback<LogoutFn>(logoutCallback,[token]);
    useEffect(authenticationEffect, [pendingAuthenticating]);
    const value = { isAuthenticated, isAuthenticating,pendingAuthenticating, authenticationError, token, login,logout};

    console.log('return AuthProvider');
    return (
        <AuthContext.Provider value = {value}>
            {children}
        </AuthContext.Provider>
    );
    
    async function logoutCallback(){
        if(!token.trim){
            return;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('items');
        setState({
            ...state,
            token : '',
            isAuthenticated : false,
        });
        return <Redirect to = {{pathname : '/login'}} />
    }

    function loginCallback(username? : string, password? : string) : void{
        console.log('Login pending...');
        setState({
            ...state,
            pendingAuthenticating : true,
            username : username,
            password : password
        });
    }

    function authenticationEffect(){
        let canceled = false;
        authenticate(); //login flow
        return () => {
            canceled = true;
        }

        async function authenticate(){
            const savedToken = localStorage.getItem('token');

            if(savedToken){
                //deja autentificat
                setState({
                    ...state,
                    isAuthenticated : true,
                    token: savedToken
                });
                return;
            }
            if(!pendingAuthenticating){
                return;
            }
            try{
                console.log('Login started...');
                setState({
                    ...state,
                    isAuthenticating : true,
                });
                //const { username, password } = state;
                const { token } = await loginApi(username,password);
                if(canceled){
                    return;
                }
                console.log("Login success");
                setState({
                    ...state,
                    token : token,
                    isAuthenticated : true,
                    isAuthenticating : false,
                    pendingAuthenticating : false
                });
                localStorage.setItem('token',token);

            }catch(err){
                if(canceled){
                    return;
                }
                console.log("Login failed");
                setState({
                    ...state,
                    authenticationError : err,
                    pendingAuthenticating : false,
                    isAuthenticating : false,
                });
                toast.error(err,{
                    position : "top-center",
                    autoClose : 5000
                });
            }
        }
    }

};