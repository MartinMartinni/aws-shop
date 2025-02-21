import React, {useEffect, useState} from "react";
import {Button, Modal, Form, Table, Col, Row, Container, FormControl} from "react-bootstrap";
import {Product} from "../model/Models";
import {ProductService} from "../services/ProductService.ts";

export interface ManagingProductsComponentProps {
    productService: ProductService
}

const ManagingProductsComponent: React.FC<ManagingProductsComponentProps> = ({ productService }) => {
    const [showModal, setShowModal] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [photo, setPhoto] = useState<File | undefined>(undefined);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [editedProduct, setEditedProduct] = useState<Product | undefined>(undefined);
    const [newProduct, setNewProduct] = useState<Product>({
        id: "",
        createdAt: "",
        name: "",
        price: 0,
        quantity: 0,
        img: ""
    });

    const fetchProducts = async () : Promise<void> => {
        const result = await productService.findAll();
        setProducts(result);
    }

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCloseModal = () => {
        setShowModal(false);
        setNewProduct({
            id: "",
            createdAt: "",
            name: "",
            img: "",
            price: 0,
            quantity: 0,
        });

        setPhoto(undefined); // Reset image preview
        setFormSubmitted(false);
    };

    const onCreateProduct = async (newProduct: Product) => {
        const productResult = await productService.saveWithImg({
            ...newProduct,
        }, photo);
        console.log("productResult: ", productResult);
        if (!productResult)
            return;

        fetchProducts();
    }

    const handleCreateProduct = async () => {
        setFormSubmitted(true);

        if (newProduct.name === "" || newProduct.price <= 0 || newProduct.quantity <= 0 || !photo) {
            return;
        }

        await onCreateProduct(newProduct);
        handleCloseModal();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
        }
    };

    const handleNameChange = (productToEdit: Product, val: string) => {
        const updatedItem = { ...productToEdit, name: val };
        setEditedProduct(updatedItem);
    };

    const handleQuantityChange = (productToEdit: Product, val: number) => {
        const updatedItem = { ...productToEdit, quantity: val < 0 ? 0 : val };
        setEditedProduct(updatedItem);
    };

    const handlePriceChange = (productToEdit: Product, val: number) => {
        const updatedItem = { ...productToEdit, price: val < 0 ? 0 : val };
        setEditedProduct(updatedItem);
    };

    const handleUpdate = async () => {
        if (!editedProduct)
            return;

        if (!editedProduct?.quantity || isNaN(editedProduct.quantity)) {
            const product = products.find((p) => p.id === editedProduct.id);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            editedProduct.quantity = product?.quantity;
        }

        if (!editedProduct?.price || isNaN(editedProduct.price)) {
            const product = products.find((p) => p.id === editedProduct.id);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            editedProduct.price = product?.price;
        }

        await productService.update(editedProduct.id, editedProduct);
        fetchProducts()
        setEditedProduct(undefined);
    };

    const formatDateCreatedAt = (dateInput: string) => {
        if (!dateInput)
            return "";

        const date = new Date(dateInput);
        const formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

        return `${formattedTime} ${formattedDate}`;
    };

    const handleUndo = () => {
        setEditedProduct(undefined);
    };

    const handleRemoveProduct = async (productId: string) => {
        await productService.deleteById(productId);
        fetchProducts()
    };

    return (
        <Container className="text-center">
            <Row>
                <Col className="justify-content-center mt-5">
                    <h2 className="text-center my-3">Products</h2>
                    <Button className="mb-3" variant="primary" onClick={() => setShowModal(true)}>
                        Create Product
                    </Button>
                    <Modal show={showModal} onHide={handleCloseModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Create Product</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Row>
                                    <Col>
                                        <Form.Group controlId="name">
                                            <Form.Label>Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter product name"
                                                value={newProduct.name}
                                                onChange={(e) =>
                                                    setNewProduct({ ...newProduct, name: e.target.value })
                                                }
                                                required
                                                isInvalid={formSubmitted && newProduct.name === ""}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Name is required.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                        <Form.Group controlId="price">
                                            <Form.Label>Price</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter product price"
                                                value={newProduct.price}
                                                onChange={(e) =>
                                                    setNewProduct({ ...newProduct, price: +e.target.value })
                                                }
                                                required
                                                isInvalid={formSubmitted && (newProduct.price <= 0 || isNaN(newProduct.price))}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Price is required and must be greater than 0.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                        <Form.Group controlId="quantity">
                                            <Form.Label>Quantity</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter product quantity"
                                                value={newProduct.quantity}
                                                onChange={(e) =>
                                                    setNewProduct({ ...newProduct, quantity: +e.target.value })
                                                }
                                                required
                                                isInvalid={formSubmitted && (newProduct.quantity <= 0 || isNaN(newProduct.quantity))}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Quantity is required and must be greater than 0.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId="img">
                                            <Form.Label>Image</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                required
                                                isInvalid={formSubmitted && !photo}
                                            />
                                            {photo && (
                                                <img
                                                    src={URL.createObjectURL(photo)}
                                                    alt="img"
                                                    style={{ maxWidth: "100px", marginTop: "10px" }}
                                                />
                                            )}
                                            <Form.Control.Feedback type="invalid">
                                                Image is required.
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
                            <Button variant="primary" onClick={handleCreateProduct}>
                                Create
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Table striped bordered hover>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Image</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products.map((product, index) => (
                            <tr key={index}>
                                <td style={{maxWidth: 80, minWidth: 80}}>
                                    {editedProduct && editedProduct.id === product.id ? (
                                        <FormControl
                                            type="text"
                                            value={editedProduct.name}
                                            onChange={(e) =>
                                                handleNameChange(editedProduct, e.target.value)
                                            }
                                        />
                                    ) : (
                                        product.name
                                    )}
                                </td>
                                <td>
                                    <img
                                        src={product.img}
                                        alt={product.name}
                                        style={{ maxWidth: "100px" }}
                                    />
                                </td>
                                <td style={{maxWidth: 80, minWidth: 80}}>
                                    {editedProduct && editedProduct.id === product.id ? (
                                        <FormControl
                                            type="number"
                                            value={editedProduct.price}
                                            onChange={(e) =>
                                                handlePriceChange(editedProduct, parseInt(e.target.value))
                                            }
                                        />
                                    ) : (
                                        product.price
                                    )}
                                </td>
                                <td style={{maxWidth: 80, minWidth: 80}}>
                                    {editedProduct && editedProduct.id === product.id ? (
                                        <FormControl
                                            type="number"
                                            value={editedProduct.quantity}
                                            onChange={(e) =>
                                                handleQuantityChange(editedProduct, parseInt(e.target.value))
                                            }
                                        />
                                    ) : (
                                        product.quantity
                                    )}
                                </td>
                                <td>{formatDateCreatedAt(product.createdAt)}</td>
                                <td style={{maxWidth: 150}}>
                                    {editedProduct && editedProduct.id === product.id ? (
                                        <div>
                                            <Button className="mx-3" variant="success" onClick={handleUpdate} style={{width: 85}}>
                                                Update
                                            </Button>
                                            <Button className="mx-3" variant="danger" onClick={handleUndo} style={{width: 85}}>
                                                Undo
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Button className="mx-3" variant="warning" onClick={() => setEditedProduct(product)} style={{width: 85}}>
                                                Edit
                                            </Button>
                                            <Button className="mx-3" variant="danger" onClick={() => handleRemoveProduct(product.id)} style={{width: 85}}>
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
        </Container>
    );
};

export default ManagingProductsComponent;
