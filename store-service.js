const Sequelize = require('sequelize');

var sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'Y6qjlzk1fZJC', {
    host: 'ep-floral-snowflake-a5idcl7l.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Define the Item model
const Item = sequelize.define('Item', {
    body: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    postDate: {
        type: Sequelize.DATE,
        allowNull: false
    },
    featureImage: {
        type: Sequelize.STRING,
        allowNull: true
    },
    published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    price: {
        type: Sequelize.DOUBLE,
        allowNull: false
    }
});

// Define the Category model
const Category = sequelize.define('Category', {
    category: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

// Define the relationship
Item.belongsTo(Category, { foreignKey: 'category' });

/**
 * Deletes an item by ID.
 * @param {string} id - The ID of the item to delete.
 * @returns {Promise} - Resolves if the item was deleted, rejects if there was an error.
 */

module.exports = {
    initialize: function () {
        return new Promise((resolve, reject) => {
            sequelize.sync()
                .then(() => resolve())
                .catch(() => reject("unable to sync the database"));
        });
    },

    getAllItems: function () {
        return new Promise((resolve, reject) => {
            Item.findAll()
                .then(data => resolve(data))
                .catch(() => reject("no results returned"));
        });
    },

    getItemsByCategory: function (category) {
        return new Promise((resolve, reject) => {
            Item.findAll({ where: { category: category } })
                .then(data => resolve(data))
                .catch(() => reject("no results returned"));
        });
    },

    getItemsByMinDate: function (minDate) {
        return new Promise((resolve, reject) => {
            Item.findAll({
                where: {
                    postDate: {
                        [Sequelize.Op.gte]: new Date(minDate)
                    }
                }
            })
            .then(data => resolve(data))
            .catch(() => reject("no results returned"));
        });
    },

    getItemById: function (id) {
        return new Promise((resolve, reject) => {
            Item.findAll({ where: { id: id } })
                .then(data => resolve(data[0]))
                .catch(() => reject("no results returned"));
        });
    },

    addItem: function (itemData) {
        return new Promise((resolve, reject) => {
            itemData.published = (itemData.published) ? true : false;

            // Replace empty strings with null
            for (let key in itemData) {
                if (itemData[key] === "") {
                    itemData[key] = null;
                }
            }

            itemData.postDate = new Date(); // Set postDate to current date

            Item.create(itemData)
                .then(() => resolve())
                .catch(() => reject("unable to create item"));
        });
    },

    getPublishedItems: function () {
        return new Promise((resolve, reject) => {
            Item.findAll({ where: { published: true } })
                .then(data => resolve(data))
                .catch(() => reject("no results returned"));
        });
    },

    getPublishedItemsByCategory: function (category) {
        return new Promise((resolve, reject) => {
            Item.findAll({ where: { published: true, category: category } })
                .then(data => resolve(data))
                .catch(() => reject("no results returned"));
        });
    },

    getCategories: function () {
        return new Promise((resolve, reject) => {
            Category.findAll()
                .then(data => resolve(data))
                .catch(() => reject("no results returned"));
        });
    }, 
    addCategory: function (categoryData) {
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }

        return Category.create(categoryData)
            .then(() => {
                return Promise.resolve("Category added successfully");
            })
            .catch(err => {
                return Promise.reject("unable to create category: " + err);
            });
    },
    deleteCategoryById: function (id) {
        return Category.destroy({ where: { id: id } })
            .then(deleted => {
                if (deleted) {
                    return Promise.resolve("Category deleted successfully");
                } else {
                    return Promise.reject("no category found with that id");
                }
            })
            .catch(err => {
                return Promise.reject("error deleting category: " + err);
            });
    },
    deletePostById: function(id) {
        return new Promise((resolve, reject) => {
            Item.destroy({ where: { id: id } })
                .then((result) => {
                    if (result === 1) { // Check if one row was affected
                        resolve();
                    } else {
                        reject(new Error("Item not found"));
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
    
};

