import "./App.css"
import "bootstrap/dist/css/bootstrap.min.css";
import React, {ReactNode} from "react";
import {
    RouterProvider,
    createBrowserRouter,
    Outlet,
    useLocation,
    Navigate
} from "react-router-dom";
import LoginFormComponent, {LoginComponentPropsSet} from "./components/LoginComponent.tsx";
import ManagingProductsComponent from "./components/ManagingProductsComponent.tsx";
import OrderCartComponent from "./components/OrderCartComponent.tsx";
import FulfilmentOrdersComponent from "./components/FulfilmentOrdersComponent.tsx";
import NavbarComponent from "./components/NavbarComponent.tsx";
import OrderingProductsComponent from "./components/OrderingProductsComponent";
import UserBankAccountHistoryComponent from "./components/UserBankAccountHistoryComponent.tsx";
import CreateAccountComponent from "./components/CreateAccountComponent.tsx";
import {AuthService} from "./services/AuthService.ts";
import {UserService} from "./services/UserService.ts";
import {ProductService} from "./services/ProductService.ts";
import {OrderService} from "./services/OrderService.ts";
import {UserBankAccountHistoryService} from "./services/UserBankAccountHistoryService.ts";
import {PhotoStorageService} from "./services/PhotoStorageService.ts";

const authService = new AuthService();
const userService = new UserService(authService);
const photoStorageService = new PhotoStorageService(authService);
const productService = new ProductService(photoStorageService);
const orderService = new OrderService();
const userBankAccountHistoryService = new UserBankAccountHistoryService();

const App: React.FC = () => {

    const props = {
            authService,
            orderService,
            userService
        } as LoginComponentPropsSet;

    const router = createBrowserRouter([
        {
            element: (
                <>
                    <NavbarConditional />
                </>
            ),
            children:[
                {
                    path: "/login",
                    element: <LoginFormComponent props={props} />
                },
                {
                    path: "/signup",
                    element: <CreateAccountComponent authService={authService} />,
                },
                {
                    path: "/managing-products",
                    element: <ProtectedComponent authService={authService} component={<ManagingProductsComponent productService={productService} />} ></ProtectedComponent>,
                },
                {
                    path: "/ordering-products",
                    element: <ProtectedComponent authService={authService} component={<OrderingProductsComponent productService={productService} />} />,
                },
                {
                    path: "/cart",
                    element: <ProtectedComponent authService={authService} component={<OrderCartComponent orderService={orderService} />} />,
                },
                {
                    path: "/fulfillment-orders",
                    element: <ProtectedComponent authService={authService} component={<FulfilmentOrdersComponent orderService={orderService}/>} />,
                },
                {
                    path: "/user-bank-account-history",
                    element: <ProtectedComponent authService={authService} component={<UserBankAccountHistoryComponent userService={userService} userBankAccountHistoryService={userBankAccountHistoryService} />} />,
                },
                // 404
                {
                    path: "/*",
                    element: <Navigate to="/login" replace={true} />
                }
            ]
        },
    ]);

    return (
        <RouterProvider router={router} />
    )
};

const ProtectedComponent: React.FC<{
    component: ReactNode
    authService: AuthService
}> = ({ component, authService}) => {
    return authService.isAuthorized() ? component : <Navigate to="/login" replace={true} />;
};

const NavbarConditional: React.FC = () => {
    const location = useLocation();

    if (["/login", "/signup"].filter(address => address === location.pathname).length > 0) {
        return <Outlet />;
    }

    return (
        <div>
            <NavbarComponent />
            <Outlet />
        </div>
    );
};

export default App;
