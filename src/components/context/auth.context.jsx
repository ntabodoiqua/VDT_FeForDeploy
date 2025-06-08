import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getHighestRole } from '../../util/authUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        username: null,
        role: null,
        scope: null
    });

    // Khôi phục trạng thái authentication từ token khi component mount
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                
                // Role priority - chọn role có quyền cao nhất
                const userRoles = decoded.scope.split(' ');
                const highestRole = getHighestRole(userRoles);

                setAuth({
                    isAuthenticated: true,
                    username: decoded.sub,
                    role: highestRole,
                    scope: decoded.scope
                });
            } catch (error) {
                console.error('Error decoding token:', error);
                // Nếu token không hợp lệ, xóa nó
                localStorage.removeItem("access_token");
                setAuth({
                    isAuthenticated: false,
                    username: null,
                    role: null,
                    scope: null
                });
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};