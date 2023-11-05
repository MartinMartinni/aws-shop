import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import React from "react";
import {NavLink, useNavigate} from "react-router-dom";
import {useUserContext} from "./UserContextComponent.tsx";
import {UserRole} from "../model/Models.ts";

const NavbarComponent: React.FC = () => {
    const {order, user} = useUserContext();
    const navigate = useNavigate();

    const handlerLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        navigate("/login")
    }

    function renderLoginLogout() {
        if (user) {
            return (
                <ul className="navbar-nav float-end">
                    <li className="nav-item">
                        <div>
                            <NavLink to="/logout" className="nav-link float-end" onClick={handlerLogout}>
                                Logout {user?.email}
                            </NavLink>
                        </div>
                    </li>
                </ul>
            );
        } else {
            return (
                <ul className="navbar-nav float-end">
                    <li className="nav-item">
                        <NavLink to="/login" className="nav-link float-end">
                            Login
                        </NavLink>
                    </li>
                </ul>
            );
        }
    }

    return (
        <div>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand>Shop based on AWS</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <ul className="navbar-nav w-100">
                            {user && user.role == UserRole.ADMIN && (
                                <li className="nav-item">
                                    <NavLink to="/managing-products" className="nav-link">
                                        Managing products
                                    </NavLink>
                                </li>
                            )}
                            <li className="nav-item">
                                <NavLink to="/ordering-products" className="nav-link">
                                    Ordering products
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/fulfillment-orders" className="nav-link">
                                    Fulfilment orders
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/user-bank-account-history" className="nav-link">
                                    User bank account history
                                </NavLink>
                            </li>
                            {order?.items?.length > 0 && (
                                <li className="nav-item">
                                    <NavLink to="/cart" className="nav-link">
                                        Cart
                                    </NavLink>
                                </li>
                            )}
                        </ul>
                        {renderLoginLogout()}
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </div>
    );
}

export default NavbarComponent;