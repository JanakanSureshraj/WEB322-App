/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Janakan Sureshraj_ 
Student ID: 153073226
Date: 2nd of August 2024
Vercel Web App URL: https://web322-app-janakan.vercel.app
GitHub Repository URL: https://github.com/JanakanSureshraj/WEB322-App.git

********************************************************************************/ 
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const storeService = require('./store-service');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = process.env.PORT || 8080;

// Handlebars helpers
const helpers = {
    navLink: function(url, options) {
        let isActive = (url === this.activeRoute) ? 'active' : '';
        return `<li class="nav-item ${isActive}"><a class="nav-link" href="${url}">${options.fn(this)}</a></li>`;
    },
    equal: function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    }, 
    formatDate: function(dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
};

// Set up Handlebars
app.engine('.hbs', exphbs.engine({ extname: '.hbs', helpers: helpers }));
app.set('view engine', '.hbs');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to handle URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Middleware to set the active route
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    console.log("Request Path: ", req.path); // Debug log
    console.log("Active Route: ", app.locals.activeRoute); // Debug log
    app.locals.viewingCategory = req.query.category;
    next();
});

// Cloudinary configuration for image storage
cloudinary.config({
    cloud_name: 'duouzaibp',
    api_key: '814312793885764',   
    api_secret: 'yYCh4Y5UZu2av_bN9q-HbY_Ubz8',
    secure: true
}); 

const upload = multer(); // No { storage: storage } since we are not using disk storage

// ROUTES

// home page redirects to /shop
app.get('/', (req, res) => {
    res.redirect('/shop');
});

// about
app.get('/about', (req, res) => {
    res.render('about', { activeAbout: true });
});

// shop
app.get('/shop', async (req, res) => {
    let viewData = {};
    try {
        let items = req.query.category 
            ? await storeService.getPublishedItemsByCategory(req.query.category)
            : await storeService.getPublishedItems();
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;
        viewData.item = items[0]; // Latest item
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }
    res.render('shop', { data: viewData });
});

// Route to handle individual item by ID within the shop route
app.get('/shop/:id', async (req, res) => {
    let viewData = {};
  
    try {
      let items = req.query.category 
          ? await storeService.getPublishedItemsByCategory(req.query.category)
          : await storeService.getPublishedItems();
  
      items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
  
      viewData.items = items;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      viewData.item = await storeService.getItemById(req.params.id);
    } catch (err) {
      viewData.message = "no results"; 
    }
  
    try {
      viewData.categories = await storeService.getCategories();
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    res.render('shop', { data: viewData });
});

// items: all, by category, by minDate
app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then(data => {
            if (data.length > 0) {
                res.render("Items", { Items: data });
            } else {
                res.render("Items", { message: "no results" });
            }
        })
        .catch(err => {
            res.status(500).render("Items", { message: "Error retrieving items: " + err });
        });
});

// item by id
app.get('/item/id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
});

// add item - form submission
app.get('/items/add', async (req, res) => {
    try {
        // Fetch categories from the store service
        const categories = await storeService.getCategories();
        // Render the addPost view with the categories
        res.render('addPost', { categories: categories });
    } catch (err) {
        // If there is an error, render the addPost view with an empty categories array
        res.render('addPost', { categories: [] });
    }
});

app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            console.error(err);
            res.status(500).send("Error uploading image");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        let newItem = {
            title: req.body.title,
            price: req.body.price,
            body: req.body.body,
            category: req.body.category,
            featureImage: req.body.featureImage,
            published: req.body.published ? true : false
        };

        storeService.addItem(newItem)
            .then(() => {
                res.redirect('/items');
            })
            .catch(err => {
                res.status(500).send("Unable to add item");
            });
    }
});

// delete an item by ID
app.get('/items/delete/:id', (req, res) => {
    const itemId = req.params.id;
    storeService.deletePostById(itemId)
        .then(() => {
            res.redirect('/items'); // Redirect to items view after deletion
        })
        .catch(() => {
            res.status(500).send('Unable to Remove Item / Item not found');
        });
});

// categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => {
            if (data.length > 0) {
                res.render("Categories", { Categories: data });
            } else {
                res.render("Categories", { message: "no results" });
            }
        })
        .catch(err => {
            res.status(500).render("Categories", { message: "Error retrieving categories: " + err });
        });
});

// GET route to display the addCategory form
app.get('/categories/add', (req, res) => {
    res.render('addCategories'); // Render the addCategory view
});

// POST route to handle form submission for adding a new category
app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect('/categories'); // Redirect to categories view after adding
        })
        .catch(() => {
            res.status(500).send('Unable to create category');
        });
});

// GET route to delete a category by ID
app.get('/categories/delete/:id', (req, res) => {
    const categoryId = req.params.id;
    storeService.deleteCategoryById(categoryId)
        .then(() => {
            res.redirect('/categories'); // Redirect to categories view after deletion
        })
        .catch(() => {
            res.status(500).send('Unable to Remove Category / Category not found');
        });
});


// custom 404 error page
app.use((req, res) => {
    res.status(404).render('404');
});

// run the server only if store service is initialized
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express HTTP server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Unable to start the server", err);
    });
