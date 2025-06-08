import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './context/auth.context';
import { getDefaultRouteByRole } from '../util/authUtils';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { auth } = useContext(AuthContext);

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
        // Redirect based on role using utility function
        const defaultRoute = getDefaultRouteByRole(auth.role);
        return <Navigate to={defaultRoute} replace />;
    }

    return children;
};

export default ProtectedRoute; 