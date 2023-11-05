import React, {useEffect, useState} from "react";
import {Alert, Button, Col, Container, Form, Modal, Row, Table} from "react-bootstrap";
import {TransferType, UserBankAccountHistory} from "../model/Models.ts";
import {useUserContext} from "./UserContextComponent.tsx";
import {UserBankAccountHistoryService} from "../services/UserBankAccountHistoryService.ts";
import {UserService} from "../services/UserService.ts";
import {HttpError} from "../exceptions/Exceptions.ts";

export interface UserBankAccountHistoryComponentProps {
    userService: UserService;
    userBankAccountHistoryService: UserBankAccountHistoryService;
}

const UserBankAccountHistoryComponent: React.FC<UserBankAccountHistoryComponentProps> = ({ userService, userBankAccountHistoryService }) => {

    const [historyData, setHistoryData] = useState<UserBankAccountHistory[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [amountOfMoney, setAmountOfMoney] = useState<number>(0);
    const [message, setMessage] = useState<Record<string, string>>({});
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [selectedTransactionType, setSelectedTransactionType] = useState<TransferType>(TransferType.CREDIT);
    const {user} = useUserContext();

    const fetchHistoryData = async () => {
        const historyData = await userBankAccountHistoryService.findAllByUserId(user?.id as string);
        setHistoryData(historyData);
    }

    useEffect(() => {
        fetchHistoryData();
    }, []);

    const handleUpdateBankAccount = async () => {
        setFormSubmitted(true);

        const value = selectedTransactionType === TransferType.CREDIT ? amountOfMoney : -Math.abs(amountOfMoney);
        try {
            await userService.updateAmountOfMoney(user?.id as string, value);
        } catch (e) {
            const response = (e as HttpError).response;
            const json = await response.json();
            setMessage({"danger" : json.requestBodyFields[0].message});
        }
        await fetchHistoryData();
        setShowModal(false);
        setAmountOfMoney(0);
        setFormSubmitted(false);
    }

    const handleCloseModal = () => {
        setShowModal(false);
        setAmountOfMoney(0);
        setFormSubmitted(false);
    }

    function handleShowModal() {
        setShowModal(true);
        setMessage({});
        setFormSubmitted(false);
    }

    function handleUpdateAmountOfMoney(val: number) {
        setAmountOfMoney(isNaN(val) || val < 0 ? 0 : val);
    }

    return (
        <Container className="text-center">
            <Row>
                <Col className="justify-content-center mt-5">
                    <h2 className="my-3">User Bank Account History</h2>
                    {message && message.danger && (
                        <Alert variant="danger">
                            {message.danger}
                        </Alert>
                    )}
                    <h4 className="my-3">Total money: ${historyData.reduce((acc, currVal) => acc + parseFloat(`${currVal.amountOfMoney}`), 0)}</h4>
                    <Button className="mb-3" variant="primary" onClick={() => handleShowModal()}>
                        Update bank account
                    </Button>
                    <Modal show={showModal} onHide={handleCloseModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Transfer money</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Row className="mb-3">
                                    <Col>
                                        <Form.Group controlId="transactionType">
                                            <Form.Label>Transaction Type</Form.Label>
                                            <div>
                                                <Form.Check
                                                    type="radio"
                                                    id="CREDIT"
                                                    label="CREDIT"
                                                    name="TransferType"
                                                    checked={selectedTransactionType === TransferType.CREDIT}
                                                    onChange={() => setSelectedTransactionType(TransferType.CREDIT)}
                                                />
                                                <Form.Check
                                                    type="radio"
                                                    id="DEBIT"
                                                    label="DEBIT"
                                                    name="TransferType"
                                                    checked={selectedTransactionType === TransferType.DEBIT}
                                                    onChange={() => setSelectedTransactionType(TransferType.DEBIT)}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Form.Group controlId="amountOfMoney">
                                            <Form.Label>Amount of Money</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter amount of money"
                                                value={amountOfMoney}
                                                onChange={(e) => handleUpdateAmountOfMoney(parseInt(e.target.value))}
                                                required
                                                isInvalid={formSubmitted && amountOfMoney === 0}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Amount of money can't be 0
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleUpdateBankAccount}>
                                Create
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Table striped bordered hover>
                        <thead>
                        <tr>
                            <th>Amount</th>
                            <th>Transfer Type</th>
                        </tr>
                        </thead>
                        <tbody>
                        {historyData?.map((item) => (
                            <tr key={item.id}>
                                <td>{item.amountOfMoney}</td>
                                <td>{item.transferType === TransferType.CREDIT ? TransferType.CREDIT : TransferType.DEBIT}</td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>
    );
};

export default UserBankAccountHistoryComponent;
