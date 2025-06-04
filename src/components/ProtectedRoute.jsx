import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './context/auth.context';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { auth } = useContext(AuthContext);

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
        // Redirect based on role
        switch (auth.role) {
            case 'ROLE_ADMIN':
                return <Navigate to="/admin" replace />;
            case 'ROLE_INSTRUCTOR':
                return <Navigate to="/instructor" replace />;
            case 'ROLE_STUDENT':
                return <Navigate to="/" replace />;
            default:
                return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute; 