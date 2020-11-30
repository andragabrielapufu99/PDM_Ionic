import axios from 'axios';
import { baseURL, prefix, config, withLogs } from '../common/index';

const authURL = `http://${baseURL}${prefix}/auth/login`;

export interface AuthProps {
    token : string;
}

export const login : (username?:string, password?:string) => Promise<AuthProps> = (username,password) => {
    return withLogs(axios.post(authURL, {username,password}, config), 'login');
};