import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {Address, Order, OrderItems, OrderStatus, User} from "../model/Models.ts";

interface UserContextType {
    user: User | undefined;
    updateUser: (newVal: User | undefined) => void;
    resetUser: () => void;
    order: Order;
    setOrder: (order: Order) => void;
    resetOrder: () => void;
    updateOrder: (newVal: Order) => void;
    setAddress: (address: Address) => void;
    setOrderItemsInCart: (products: OrderItems[]) => void;
}

const UserContextComponent = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
    const context = useContext(UserContextComponent);
    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    return context;
};

const orderEmpty = {
    id: 0,
    userId: "",
    price: 0,
    orderStatus: OrderStatus.PENDING,
    address: {
        country: "",
        city: "",
        street: "",
        postCode: "",
        houseNumber: "",
        localNumber: ""
    },
    items: []
} as Order;
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | undefined>(undefined);
    const [order, setOrder] = useState<Order>({...orderEmpty});

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            console.log("storedUser: ", storedUser);
            setUser(JSON.parse(storedUser) as User);
        }

        const storedOrder = localStorage.getItem("order") || JSON.stringify(orderEmpty);
        console.log("storedOrder: ", storedOrder);
        if (storedOrder) {
            setOrder(JSON.parse(storedOrder) as Order);
        }
    }, []);

    const updateUser = (newVal: User | undefined) => {
        localStorage.setItem("user", JSON.stringify(newVal));
        setUser(newVal);
    };

    const resetUser = () => {
        localStorage.removeItem("user");
        setUser(undefined);
        console.log("user", user);
    };

    const resetOrder = () => {
        localStorage.removeItem("order");
        setOrder({
                id: 0,
                userId: "",
                price: 0,
                orderStatus: OrderStatus.PENDING,
                address: {
                    country: "",
                    city: "",
                    street: "",
                    postCode: "",
                    houseNumber: "",
                    localNumber: ""
                },
                items: []
            });
        console.log("order", order);
    };

    const updateOrder = (newVal: Order) => {
        setOrder({...newVal})
        localStorage.setItem("order", JSON.stringify(newVal));
    }

    const setOrderItemsInCart = (orderItems: OrderItems[]) => {
        order.items = orderItems;
        order.price = order.items.reduce((acc, currVal) => acc + currVal.subTotal, 0);
        setOrder({...order});
        localStorage.setItem("order", JSON.stringify(order));
    }

    const setAddress = (address: Address) => {
        order.address = address;
        setOrder({...order});
        localStorage.setItem("order", JSON.stringify(order));
    }

    console.log("productsInCart: ", order.items);

    return (
        <UserContextComponent.Provider value={{
            order,
            setOrder,
            resetOrder,
            updateOrder,
            setAddress,
            user,
            updateUser,
            resetUser,
            setOrderItemsInCart
        }}>
            {children}
        </UserContextComponent.Provider>
    );
};
