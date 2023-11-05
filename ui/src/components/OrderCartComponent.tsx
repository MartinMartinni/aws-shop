import React, {useEffect, useState} from "react";
import {Alert, Button, Col, Container, FormControl, Row, Table} from "react-bootstrap";
import {Address, Order, OrderItems, OrderStatus, RequestErrorField} from "../model/Models";
import {OrderService} from "../services/OrderService.ts";
import {WebSocketApiStack} from "../../cdk-outputs.json";
import {useUserContext} from "./UserContextComponent.tsx";
import {generateRandomId} from "../utils/Utils.ts";
import {useNavigate} from "react-router-dom";
import {HttpError} from "../exceptions/Exceptions.ts";

const alertDanger = {"color": "#721c24", "background-color": "#f8d7da", "border-color": "#f5c6cb"};

let socket: WebSocket;

export interface OrderCartComponentProps {
    orderService: OrderService;
}

const OrderCartComponent: React.FC<OrderCartComponentProps> = ({ orderService }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [editedAddress, setEditedAddress] = useState<Address| undefined>(undefined);
    const [message, setMessage] = useState<Record<string, string>>({});
    const [editedItem, setEditedItem] = useState<OrderItems | undefined>(undefined);
    const [blockButtons, setBlockButtons] = useState<boolean>(true);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const {order, setOrder, resetOrder, updateOrder, setOrderItemsInCart, setAddress} = useUserContext();
    const navigate = useNavigate();
    const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

    const establishWebsocketConnection = () => {
        const webSocketUrl = `${WebSocketApiStack.WebSocketApiEndpoint}/dev/`;
        socket = new WebSocket(webSocketUrl);
        console.log("establish websocket connection with url: ", webSocketUrl);
        socket.onopen = (event) => {
            console.log('WebSocket opened', event);
        };

        socket.onmessage = (event) => {
            console.log('Received data:', event.data);
            const data = JSON.parse(event.data);
            if (data.status === OrderStatus.COMPLETED) {
                setMessage({"success": `${data.status}`});
                setBlockButtons(true);
                setOrderItemsInCart([]);
                setTimeout(() => {
                    resetOrder();
                    navigate("/ordering-products");
                }, 2000)
            } else {
                setMessage({"danger": `${JSON.parse(data.errorMessage).exception.message}`});
                setBlockButtons(false);
            }
            setIsLoading(false);
        };

        socket.onerror = (event) => {
            console.error("Error: ", event);
        }

        socket.onclose = (event) => {
            console.log('WebSocket closed', event);
        };
    }

    useEffect(() => {
        establishWebsocketConnection();
        setBlockButtons(false);

        return () => {
            socket.close();
        }
    }, []);

    const handlePlaceOrder = async () => {
        setMessage({});
        setFormSubmitted(true);
        setIsLoading(true);
        setBlockButtons(true);

        let savedOrder: Order;
        try {
            savedOrder = await orderService.save(order);
        } catch (e) {
            const error = e as HttpError;
            const response = error.response;
            const json = await response.json();
            console.log("Error json: ", json);
            if (response.status == 400) {
                const requestBodyFields = json.requestBodyFields as RequestErrorField[]
                const addressErrorFields = requestBodyFields.reduce((acc, currVal) => {
                    const field = `${currVal.name}`;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    acc[field] = field;
                    return acc;
                }, {});
                setAddressErrors({...addressErrorFields});
                setMessage({"danger": `All address fields must be filled. Actual omitted are: ${Object.keys(addressErrorFields).reduce((acc, currVal) => acc.concat(`${currVal}, `), "")}`});
                setBlockButtons(false);
                setIsLoading(false);
                return;
            }

            setMessage({"danger": error.message});
            setBlockButtons(false);
            setIsLoading(false);
            return;
        }

        setOrder(savedOrder);

        const executionName = generateRandomId();
        try {
            socket.send(JSON.stringify({"action": "trackStatus", "executionName": executionName}));
            console.log("message has been sent successfully");
        } catch (e) {
            console.error("Error: ", e);
            return;
        }

        const result = await orderService.place(`${savedOrder.id}`, savedOrder.userId, executionName) as { executionName: string } | undefined;
        console.log("result: ", result);

        if (!result) {
            throw new Error("Step function doesn't start");
        }
    };

    const handleQuantityChange = (itemToEdit: OrderItems, newQuantity: number) => {
        if (newQuantity > 0) {
            const updatedItem = { ...itemToEdit, quantity: newQuantity, subTotal: newQuantity * itemToEdit.price };
            setEditedItem(updatedItem);
        }
    };

    const handleUpdateAddress = () => {
        if (!editedAddress)
            return;

        setAddress(editedAddress)
        setEditedAddress(undefined);
    }

    const handleUndoAddress = () => {
        setEditedAddress(undefined);
    };

    const handleUpdate = () => {
        if (editedItem) {
            const updatedOrderItems = order?.items.map((item) =>
                item.productId === editedItem.productId ? editedItem : item
            );

            if (order) {
                order.items = updatedOrderItems || [];
                order.price = order.items?.reduce((acc, currVal) => acc += currVal.subTotal, 0);
                setOrderItemsInCart(order.items);
                setEditedItem(undefined);
            }
        }
    };

    const handleUndo = () => {
        setEditedItem(undefined);
    };

    const handleRemoveProduct = (itemId: string) => {
        const updatedOrderItems = order?.items.filter((item) => item.productId !== itemId);

        if (order) {
            order.items = updatedOrderItems || [];
            order.price = order.items?.reduce((acc, currVal) => acc += currVal.subTotal, 0);
            setEditedItem(undefined);
            updateOrder({...order});
        }
    };

    function updateAddressField(editedAddress: Address | null, target: (EventTarget & HTMLInputElement) | (EventTarget & HTMLTextAreaElement)) {
        const { name, value } = target;
        if (addressErrors[name]) {
            delete addressErrors[name];
            setAddressErrors({...addressErrors});
        }
        setEditedAddress({
            ...editedAddress,
            [name]: value,
        } as Address);
    }

    return (
        <Container className="text-center">
            <Row className="justify-content-center mt-5">
                <h2 className="my-3">Order Cart</h2>
                <div>
                    <div>
                        {message && message.success && (
                            <Alert variant="success">
                                {message.success}
                            </Alert>
                        )}
                        {message && message.danger && (
                            <Alert variant="danger">
                                {message.danger}
                            </Alert>
                        )}
                    </div>
                    <h4 className="my-3">Total Price: ${order.price}</h4>
                    <Row>
                        <Col xs={4}></Col>
                        <Col xs={4}>
                            <Button disabled={blockButtons || !order.price} variant="primary" onClick={handlePlaceOrder}>
                                {isLoading ? "Processing Order..." : "Place Order"}
                            </Button>
                        </Col>
                        <Col xs={4}>
                            <Button disabled={blockButtons || !order.items.length} variant="danger" onClick={() => setOrderItemsInCart([])}>
                                Remove all products
                            </Button>
                        </Col>
                    </Row>
                </div>
                <div>
                    <Row>
                        <Col md={{span: 4}}>
                            <h4>Order Detail:</h4>
                            <Table striped bordered>
                                <tbody>
                                    {order.id ? (
                                        <tr>
                                            <td width={150}>ID</td>
                                            <td>{order.id}</td>
                                        </tr>
                                    ) : (<div></div>)}
                                    <tr>
                                        <td>Order status</td>
                                        <td>{order.orderStatus}</td>
                                    </tr>
                                    <tr>
                                        <td>Price</td>
                                        <td>${order.price}</td>
                                    </tr>
                                </tbody>
                            </Table>
                            <h4>Address:</h4>
                            <Table striped bordered>
                                <tbody>
                                <tr>
                                    <td width={150}>Country</td>
                                    {editedAddress ? (
                                        <FormControl
                                            type="text"
                                            name="country"
                                            value={editedAddress?.country}
                                            onChange={(e) => updateAddressField(editedAddress, e.target)}
                                            isInvalid={formSubmitted && editedAddress?.country === ""}
                                        />
                                    ) : (
                                        <td style={formSubmitted && addressErrors?.country ? alertDanger : {}}>{order?.address?.country}</td>
                                    )}
                                </tr>
                                <tr>
                                    <td>City</td>
                                    {editedAddress ? (
                                        <FormControl
                                            type="text"
                                            name="city"
                                            value={editedAddress?.city}
                                            onChange={(e) => updateAddressField(editedAddress, e.target)}
                                            isInvalid={formSubmitted && editedAddress?.city === ""}
                                        />
                                    ) : (
                                        <td style={formSubmitted && addressErrors?.city ? alertDanger : {}}>{order?.address?.city}</td>
                                    )}
                                </tr>
                                <tr>
                                    <td>Post Code</td>
                                    {editedAddress ? (
                                        <FormControl
                                            type="text"
                                            name="postCode"
                                            value={editedAddress?.postCode}
                                            onChange={(e) => updateAddressField(editedAddress, e.target)}
                                            isInvalid={formSubmitted && editedAddress?.postCode === ""}
                                        />
                                    ) : (
                                        <td style={formSubmitted && addressErrors?.postCode ? alertDanger : {}}>{order?.address?.postCode}</td>
                                    )}
                                </tr>
                                <tr>
                                    <td>Street</td>
                                    {editedAddress ? (
                                        <FormControl
                                            type="text"
                                            name="street"
                                            value={editedAddress?.street}
                                            onChange={(e) => updateAddressField(editedAddress, e.target)}
                                            isInvalid={formSubmitted && editedAddress?.street === ""}
                                        />
                                    ) : (
                                        <td style={formSubmitted && addressErrors?.street ? alertDanger : {}}>{order?.address?.street}</td>
                                    )}
                                </tr>
                                <tr>
                                    <td>House Number</td>
                                    {editedAddress ? (
                                        <FormControl
                                            type="text"
                                            name="houseNumber"
                                            value={editedAddress?.houseNumber}
                                            onChange={(e) => updateAddressField(editedAddress, e.target)}
                                            isInvalid={formSubmitted && editedAddress?.houseNumber === ""}
                                        />
                                    ) : (
                                        <td style={formSubmitted && addressErrors?.houseNumber ? alertDanger : {}}>{order?.address?.houseNumber}</td>
                                    )}
                                </tr>
                                <tr>
                                    <td>Local Number</td>
                                    {editedAddress ? (
                                        <FormControl
                                            type="text"
                                            name="localNumber"
                                            value={editedAddress?.localNumber}
                                            onChange={(e) => updateAddressField(editedAddress, e.target)}
                                            isInvalid={formSubmitted && editedAddress?.localNumber === ""}
                                        />
                                    ) : (
                                        <td style={formSubmitted && addressErrors?.localNumber ? alertDanger : {}}>{order?.address?.localNumber}</td>
                                    )}
                                </tr>
                                <tr>
                                    <td></td>
                                    <td>
                                        {editedAddress ? (
                                            <div>
                                                <Button disabled={blockButtons} variant="success" onClick={handleUpdateAddress} style={{width: 85}}>
                                                    Update
                                                </Button>
                                                <Button disabled={blockButtons} className="mx-3" variant="danger" onClick={handleUndoAddress} style={{width: 85}}>
                                                    Undo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Button disabled={blockButtons} variant="warning" onClick={() => setEditedAddress(order?.address)} style={{width: 85}}>
                                                    Edit
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                </tbody>
                            </Table>
                        </Col>
                        <Col>
                            <h4>Order Items:</h4>
                            <Table striped bordered hover>
                                <thead>
                                <tr>
                                    <th style={{width:120}}>Name</th>
                                    <th style={{width:120}}>Img</th>
                                    <th>Quantity</th>
                                    <th style={{width:100}}>Price</th>
                                    <th style={{width:100}}>Sub total</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {order.items?.map((item: OrderItems) => (
                                    <tr key={item.productId}>
                                        <td>{item.productName}</td>
                                        <td>
                                            <img
                                                src={item.productImg}
                                                alt="img"
                                                style={{ maxWidth: "100px", marginTop: "10px" }}
                                            />
                                        </td>
                                        <td style={{maxWidth: 80, minWidth: 80}}>
                                            {editedItem && editedItem.productId === item.productId ? (
                                                <FormControl
                                                    type="number"
                                                    value={editedItem.quantity}
                                                    onChange={(e) =>
                                                        handleQuantityChange(editedItem, parseInt(e.target.value, 10))
                                                    }
                                                />
                                            ) : (
                                                item.quantity
                                            )}
                                        </td>
                                        <td>${item.price}</td>
                                        <td>${(editedItem?.productId === item?.productId ? editedItem.subTotal : item.subTotal)}</td>
                                        <td style={{maxWidth: 150, minWidth: 80}}>
                                            {editedItem && editedItem.productId === item.productId ? (
                                                <div>
                                                    <Button disabled={blockButtons} className="mx-3" variant="success" onClick={handleUpdate} style={{width: 85}}>
                                                        Update
                                                    </Button>
                                                    <Button disabled={blockButtons} className="mx-3" variant="danger" onClick={handleUndo} style={{width: 85}}>
                                                        Undo
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Button disabled={blockButtons} className="mx-3" variant="warning" onClick={() => setEditedItem(item)} style={{width: 85}}>
                                                        Edit
                                                    </Button>
                                                    <Button disabled={blockButtons} className="mx-3" variant="danger" onClick={() => handleRemoveProduct(item.productId)} style={{width: 85}}>
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </div>
            </Row>
        </Container>
    );
};

export default OrderCartComponent;
