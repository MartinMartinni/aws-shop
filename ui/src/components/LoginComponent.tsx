import "bootstrap/dist/css/bootstrap.min.css";
import React, {useEffect, useState} from "react";
import {Form, Button, Row, Alert, Table} from "react-bootstrap";
import Container from "react-bootstrap/Container";
import {Link, Navigate} from "react-router-dom";
import {AuthService} from "../services/AuthService.ts";
import {UserService} from "../services/UserService.ts";
import {useUserContext} from "./UserContextComponent.tsx";
import {HttpService} from "../services/HttpService.ts";
import {OrderService} from "../services/OrderService.ts";
import {Order} from "../model/Models.ts";

export interface LoginComponentPropsSet {
    authService: AuthService,
    orderService: OrderService,
    userService: UserService
}

export interface LoginComponentProps {
    props: LoginComponentPropsSet
}

const LoginComponent: React.FC<LoginComponentProps> = ({ props }) => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const {resetUser, updateUser, order, setOrder, resetOrder} = useUserContext();

    useEffect(() => {
        props.authService.logout();
        HttpService.resetToken();
        resetUser();
        resetOrder();
    }, []);

    const handleLogin = () => {
        const errors: Record<string, string> = {};

        if (!username) {
            errors.username = "Username is required.";
        }

        if (!password) {
            errors.password = "Password is required.";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
        } else {
            setValidationErrors({});
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (username && password) {
            const loginResponse = await props.authService.login(username, password);

            if (loginResponse) {
                console.log("I have been logged successfully")
                const user = await props.userService.getUser(AuthService.jwtToken!);

                if (!user)
                    throw new Error(`User by username: ${username} not found!`);

                console.log("user: ", user);
                updateUser(user);
                HttpService.setJwtToken(AuthService.jwtToken)
                setLoginSuccess(true);
                const activeOrders = await props.orderService.findAllActiveByUserId(user.id) as Order[];
                console.log("activeOrders: ", activeOrders);

                if (activeOrders.length) {
                    setOrder(activeOrders[0]);
                } else {
                    order.userId = user.id;
                    setOrder({...order});
                    console.log("order after login: ", order);
                }
            } else {
                console.log("Invalid credentials");
                setErrorMessage("Invalid credentials")
            }
        }
    };

    return (
        <Container>
            {loginSuccess && <Navigate to="/ordering-products" replace={true} />}
            <Row className="justify-content-center mt-5">
                <Table bordered>
                    <thead>
                        <tr>
                            <th>First name</th>
                            <th>Surname</th>
                            <th>Email</th>
                            <th>Password</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Michal</td>
                            <td>Kowalski</td>
                            <td>michal.kowalski@test.com</td>
                            <td>MichalKowalski!#1</td>
                            <td>USER</td>
                        </tr>
                        <tr>
                            <td>Kamil</td>
                            <td>Kowalski</td>
                            <td>kamil.kowalski@test.com</td>
                            <td>KamilKowalski!$1</td>
                            <td>USER</td>
                        </tr>
                    </tbody>
                </Table>
            </Row>
            <Row className="justify-content-center mt-5">
                <Form onSubmit={handleSubmit} className="bg-light p-5 rounded mt-5" style={{ width: "500px", height: "500px" }}>
                    <h2 className="text-center mb-4">Login</h2>
                    {errorMessage && (
                        <Alert variant="danger" className="text-center">
                            {errorMessage}
                        </Alert>
                    )}
                    <Form.Group className="mb-2" controlId="username">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                            type="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Form.Text className="text-danger">
                            {validationErrors.username}
                        </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-2" controlId="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Form.Text className="text-danger">
                            {validationErrors.password}
                        </Form.Text>
                    </Form.Group>
                    <br/>
                    <br/>
                    <div className="text-center">
                        <Button variant="primary" type="submit" onClick={handleLogin}>
                            Login
                        </Button>
                        <div className="vh-100 justify-content-center align-items-center">
                            <br/>
                            <Link to="/signup">
                                <Button variant="link">Create Account</Button>
                            </Link>
                        </div>
                    </div>
                </Form>

            </Row>
        </Container>
    );
};

export default LoginComponent;
