import React, {useState} from "react";
import {Alert, Button, Col, Container, Form, Row} from "react-bootstrap";
import {Link} from "react-router-dom";
import {AuthService} from "../services/AuthService.ts";
import {User, UserRole} from "../model/Models.ts";

interface CreateAccountComponentProps {
    authService: AuthService
}

const CreateAccountComponent: React.FC<CreateAccountComponentProps> = ({ authService }) => {
    const [user, setUser] = useState<User>({
        id: "",
        sub: "",
        name: "",
        email: "",
        role: UserRole.USER,
        amountOfMoney: 0,
        password: ""
    });

    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<Record<string, string>>({});
    const [signedUp, setSignedUp] = useState<boolean>(false);
    const [verificationCode, setVerificationCode] = useState<string>("");

    const handleAmountOfMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const money = parseFloat(value);

        if (money < 0) {
            return;
        }

        setUser({ ...user, amountOfMoney: money });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser({ ...user, [name]: name === "amountOfMoney" ? parseFloat(value) : value });
    };

    const signUp = async () => {
        try {
            await authService.signUp(
                user.name,
                user.password,
                user.email,
                {
                    "custom:role": `${user.role}`,
                    "custom:amountOfMoney": `${user.amountOfMoney}`
                }
            );
            console.log("Sign-up successful");
            setMessage({"info": "We have send verification code into your mailbox. Check it and verify yourself."});
            setSignedUp(true);
            return true;
        } catch (error) {
            console.error("Error signing up:", error);
            setMessage({"error": `Error signing up: ${error}`});
            return false;
        }
    };

    const handleVerify = async () => {
        try {
            await authService.confirmSignUp(user.name, verificationCode);
            setMessage({"success": "Verified Successfully."})
            setSignedUp(false)
        } catch (error) {
            setMessage({"error": `Error during verification: ${error}`})
        }
    }

    const handleCreateAccount = async () => {
        const errors: Record<string, string> = {};

        if (!user.name) {
            errors.name = "Name is required.";
        }

        if (!user.email) {
            errors.email = "Email is required.";
        } else if (!isValidEmail(user.email)) {
            errors.email = "Invalid email address.";
        }

        if (!user.password) {
            errors.password = "Password is required.";
        } else if (user.password !== passwordConfirm) {
            errors.password = "Passwords don't match.";
        }

        if (user.amountOfMoney < 0) {
            errors.amountOfMoney = "Amount of money cannot be negative.";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
        } else {
            setValidationErrors({});
            console.log("User:", user);
            await signUp();
        }
    };

    const handleUserRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setUser({
            ...user,
            role: e.target.value
        } as User)
    }

    const isValidEmail = (email: string) => {
        const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
        return emailRegex.test(email);
    };

    return (
        <Container>
            <Row className="justify-content-center mt-5">
                <Col xs={6}>
                    <div className="text-center my-3">
                        <h2>Create Account</h2>
                    </div>
                    {message && message.success && (
                        <Alert variant="success" className="text-center">
                            {message.success}
                        </Alert>
                    )}

                    {message && message.info && (
                        <Alert variant="info" className="text-center">
                            {message.info}
                        </Alert>
                    )}

                    {message && message.error && (
                        <Alert variant="danger" className="text-center">
                            {message.error}
                        </Alert>
                    )}
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                value={user.name}
                                onChange={handleInputChange}
                                required
                            />
                            <Form.Text className="text-danger">
                                {validationErrors.name}
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={user.email}
                                onChange={handleInputChange}
                                required
                            />
                            <Form.Text className="text-danger">
                                {validationErrors.email}
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Role</Form.Label>
                            <Form.Select aria-label="Default select" onChange={handleUserRoleChange} defaultValue={UserRole.ADMIN}>
                                {Object.keys(UserRole).map((key, index) => (
                                    <option key={index} value={key}>
                                        {key}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Amount of Money</Form.Label>
                            <Form.Control
                                type="number"
                                name="amountOfMoney"
                                placeholder="Enter the amount of money"
                                value={user.amountOfMoney}
                                onChange={handleAmountOfMoneyChange}
                                required
                            />
                            <Form.Text className="text-danger">
                                {validationErrors.amountOfMoney}
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={user.password}
                                onChange={handleInputChange}
                                required
                            />
                            <Form.Text className="text-danger">
                                {validationErrors.password}
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Confirm Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="passwordConfirm"
                                placeholder="Confirm your password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <br/>
                            {signedUp && (
                                <Row>
                                    <Form.Label>Verification Code</Form.Label>
                                    <Col xs={3}>
                                        <Form.Control
                                            type="verification"
                                            name="verificationCode"
                                            placeholder="Enter code"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            required
                                        />
                                    </Col>
                                    <Col>
                                        <Button variant="primary" onClick={handleVerify}>
                                            Verify
                                        </Button>
                                    </Col>
                                </Row>
                            )}
                        <br/>
                        <div className="text-center">
                            <Button variant="primary" onClick={handleCreateAccount} disabled={signedUp}>
                                Create account
                            </Button>
                        </div>
                        <div className="text-center mt-3">
                            <Link to="/login">
                                <Button variant="link">Login</Button>
                            </Link>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateAccountComponent;
