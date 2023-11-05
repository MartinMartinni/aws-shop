-- Your SQL scripts for initialization goes here...

USE main;

CREATE TABLE IF NOT EXISTS Orders (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            customerId INT NOT NULL,
                            orderStatus ENUM(
                                'PENDING',
                                'COMPLETED',
                                'FAILURE'),
                            price DECIMAL(10, 2) NOT NULL,
                            country VARCHAR(100) NOT NULL,
                            city VARCHAR(100) NOT NULL,
                            postCode VARCHAR(100) NOT NULL,
                            street VARCHAR(100) NOT NULL,
                            houseNumber VARCHAR(100) NOT NULL,
                            localNumber VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS OrderItems (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            productId VARCHAR(100) NOT NULL,
                            productName VARCHAR(100) NOT NULL,
                            productImg VARCHAR(255) NOT NULL,
                            quantity INT NOT NULL,
                            price DECIMAL(10, 2) NOT NULL,
                            subTotal DECIMAL(10, 2) NOT NULL,
                            orderId INT NOT NULL,
                            FOREIGN KEY (orderId) REFERENCES Orders(id)
);