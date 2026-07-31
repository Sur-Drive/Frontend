import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
    const token = localStorage.getItem("token");
    const isAuthenticated = !!token;

    return isAuthenticated ? (
        <Outlet />
    ) : (
        <Navigate to="/fleet/login" replace />
    );
};

export default PrivateRoute;
