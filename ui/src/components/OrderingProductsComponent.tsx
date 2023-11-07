import React, {useEffect, useState} from "react";
import {Button, Table, Container, FormControl, Row, Col} from "react-bootstrap";
import {OrderItems, Product} from "../model/Models";
import {ProductService} from "../services/ProductService.ts";
import {useUserContext} from "./UserContextComponent.tsx";
import {mapProductToOrderItem} from "../mapper/Mappers.ts";

export interface OrderingProductsComponentProps {
    productService: ProductService
}

const OrderingProductsComponent: React.FC<OrderingProductsComponentProps> = ({ productService }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [editedOrderItem, setEditedOrderItem] = useState<OrderItems | null>(null);
    const {order, setOrderItemsInCart} = useUserContext();

    const fetchProducts = async () : Promise<void> => {
        const fetchedProducts = await productService.findAll();
        console.log("fetchedProducts: ", fetchedProducts);
        setProducts(fetchedProducts);
    }
    
    useEffect(() => {
        fetchProducts();
    }, [])

    const handleQuantityChange = (orderItemToEdit: OrderItems, requiredQuantity: number, maxQuantity: number) => {
        if (requiredQuantity <= 0 || requiredQuantity > maxQuantity)
            return;

        const updatedItem = { ...orderItemToEdit, quantity: requiredQuantity, subTotal: requiredQuantity * orderItemToEdit.price } as OrderItems;
        setEditedOrderItem(updatedItem);
    };

    const handleUpdate = () => {
        if (!editedOrderItem)
            return;

        if (isNaN(editedOrderItem.quantity)) {
            const product = order.items.find((p) => p.productId === editedOrderItem.productId);
            editedOrderItem.quantity = product?.quantity as number;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            editedOrderItem.subTotal = editedOrderItem.quantity * product.subTotal;
        }

        const updatedProducts = order.items.map((orderItemInCart) =>
            orderItemInCart.productId === editedOrderItem.productId ? editedOrderItem : orderItemInCart
        );

        setOrderItemsInCart(updatedProducts);
        setEditedOrderItem(null);
    };

    const handleUndo = () => {
        setEditedOrderItem(null);
    };

    function handleRemoveProductFromCart(productId: string) {
        const updatedOrderItems = order.items.filter((orderItem) => orderItem.productId !== productId);
        setOrderItemsInCart(updatedOrderItems)
    }

    function setEditedOrderItemFromProduct(product: Product) {
        const orderItem = order.items.find(orderItem => orderItem.productId === product.id);

        if (!orderItem) {
            throw new Error(`Cannot find orderItem by id: ${product.id} during setEditedOrderItemFromProduct`);
        }

        setEditedOrderItem(orderItem);
    }

    function handleAddCart(product: Product) {
        const orderItems = order.items.find(orderItemInCart => orderItemInCart.productId === product.id);

        if (!orderItems) {
            const item = mapProductToOrderItem(product);
            item.quantity = 1;
            item.subTotal = item.price
            order.items.push(item);
        } else {
            order.items.forEach(item => {
                if (item.productId === product.id) {
                    item.quantity = 1;
                    item.subTotal = item.price
                }
            })
        }

        setOrderItemsInCart([...order.items]);
    }

    return (
        <Container className="text-center">
            <Row>
                <Col className="justify-content-center mt-5">
                    <h2 className="my-3">Products</h2>
                    <h4 className="my-3">Total Price: ${order.price}</h4>
                    <Table striped bordered hover>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Image</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products?.map((product: Product) => (
                            product.quantity > 0 ?
                                <tr key={product.id}>
                                    <td>{product.name}</td>
                                    <td>
                                        <img
                                            src={product.img}
                                            alt={product.name}
                                            style={{ maxWidth: "100px" }}
                                        />
                                    </td>
                                    <td style={{maxWidth: 80, minWidth: 80}}>
                                        {product.price}
                                    </td>
                                    <td style={{maxWidth: 80, minWidth: 80}}>
                                        {editedOrderItem && editedOrderItem.productId === product.id ? (
                                            <FormControl
                                                type="number"
                                                value={editedOrderItem.quantity}
                                                onChange={(e) =>
                                                    handleQuantityChange(editedOrderItem, parseInt(e.target.value), product.quantity)
                                                }
                                            />
                                        ) : (<div>
                                                {order.items.filter((orderItemInCart: OrderItems) => orderItemInCart.productId === product.id).length
                                                    ? (
                                                        (order.items.find((orderItemInCart: OrderItems) => orderItemInCart.productId === product.id)?.quantity) + "/" + product.quantity
                                                    ) : (
                                                        product.quantity
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{width: 450}}>
                                        {editedOrderItem && editedOrderItem.productId === product.id ? (
                                            <div>
                                                <Button className="mx-3" variant="success" onClick={handleUpdate} style={{width: 150}}>
                                                    Update
                                                </Button>
                                                <Button className="mx-3" variant="danger" onClick={handleUndo} style={{width: 170}}>
                                                    undo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                {order.items.filter((orderItemInCart: OrderItems) => orderItemInCart.productId === product.id).length
                                                    ? (
                                                        <div>
                                                            <Button className="mx-3" variant="warning" onClick={() => setEditedOrderItemFromProduct(product)} style={{width: 150}}>
                                                                Set quantity
                                                            </Button>
                                                            <Button className="mx-3" variant="danger" onClick={() => handleRemoveProductFromCart(product.id)} style={{width: 170}}>
                                                                Remove from cart
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button className="mx-3" variant="success" onClick={() => handleAddCart(product)} style={{width: 170}}>
                                                            Add to cart
                                                        </Button>
                                                    )
                                                }
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            :
                                <tr></tr>
                        ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>
    );
};

export default OrderingProductsComponent;
