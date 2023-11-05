import React, {useEffect, useState} from "react";
import {Button, Container, Row, Table} from "react-bootstrap";
import {Order, OrderItems, UserRole} from "./../model/Models.ts";
import {OrderService} from "../services/OrderService.ts";
import {useUserContext} from "./UserContextComponent.tsx";

export interface FulfilmentOrdersComponentProps {
    orderService: OrderService
}
const FulfilmentOrdersComponent: React.FC<FulfilmentOrdersComponentProps> = ({ orderService }) => {
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [usersOrders, setUsersOrders] = useState<Order[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const {user} = useUserContext();

    const toggleExpansion = (orderId: number) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            return;
        }

        setExpandedOrderId(orderId);
    };

    const fetchFulfilmentOrders = async () : Promise<void> => {
        const fetchedOrders = await orderService.findAllFulfilment(user?.id);
        const fetchedUsersOrders = await orderService.findAllFulfilment();

        setOrders(fetchedOrders);
        setUsersOrders(fetchedUsersOrders);
    }

    useEffect(() => {
        console.log("user?.role" , user?.role);
        fetchFulfilmentOrders();
    }, []);

    function getOrderTable(title: string, orders: Order[]) {
        return <div>
            <h4 className="text-center my-3">{title}</h4>
            <Table striped bordered hover>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Order Type</th>
                    <th>Price</th>
                    <th>Address</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {orders.map((order: Order) => (
                    <React.Fragment key={order.id}>
                        <tr>
                            <td>{order.id}</td>
                            <td>{order.userId}</td>
                            <td>{order.orderStatus}</td>
                            <td>{order?.price}</td>
                            <td>
                                {order.address.country}, {order.address.city},{" "}
                                {order.address.postCode}
                            </td>
                            <td>
                                <Button
                                    variant="primary"
                                    onClick={() => toggleExpansion(order.id)}
                                >
                                    {expandedOrderId === order.id ? "Collapse" : "Expand"}
                                </Button>
                            </td>
                        </tr>
                        {expandedOrderId === order.id && (
                            <tr>
                                <td colSpan={6}>
                                    <Table>
                                        <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Img</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Subtotal</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {order.items.map((item: OrderItems) => (
                                            <tr key={item.id}>
                                                <td>{item.id}</td>
                                                <td>
                                                    <img
                                                        src={item.productImg}
                                                        alt="img"
                                                        style={{maxWidth: "100px", marginTop: "10px"}}
                                                    />
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>${parseFloat(`${item.price}`).toFixed(2)}</td>
                                                <td>${parseFloat(`${item.subTotal}`).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </Table>
        </div>;
    }

    return (
        <Container>
            <Row className="justify-content-center mt-5">
                <h2 className="text-center my-3">Fulfilment orders</h2>

                {user?.role == UserRole.ADMIN ? getOrderTable("My", orders) : <div></div>}
                {getOrderTable("All", usersOrders)}
            </Row>
        </Container>
    );
};

export default FulfilmentOrdersComponent;