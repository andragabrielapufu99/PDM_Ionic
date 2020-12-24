import PropTypes from 'prop-types';
import React, {useContext} from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AuthContext, AuthState } from './AuthProvider';

export interface PrivateRouteProps {
    component : PropTypes.ReactNodeLike;
    path : string;
    exact? : boolean;
};

export const PrivateRoute : React.FC<PrivateRouteProps> = ({ component : Component, ...rest}) => {
    const { isAuthenticated } = useContext<AuthState>(AuthContext);
    return (
        <Route {...rest} render = { props => {
            if (isAuthenticated){
                console.log('PrivateRoute : return component');
                // @ts-ignore
                return <Component {...props} />;
            }
            else {
                console.log('PrivateRoute : redirect /login');
                return <Redirect to = {{pathname: '/login'}}/>
            }
        }}/>
    );
};