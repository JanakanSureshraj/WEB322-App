const express = require('express');
const path = require('path');

// use store-service.js file to interact the data from server.js
const storeService = require('./store-service');

// create an express app
const app = express();
const PORT = process.env.PORT || 8080;

// static middleware to serve static files from the public folder
app.use(express.static('public'));

// route to redirect from '/' to '/about'
app.get('/', (req, res) =>{
    res.redirect('/about');
});

// route to serve about.html from the views folder
app.get('/about', (req, res) =>{
    res.sendFile(__dirname + '/views/about.html');
});

// route to get all published items
app.get('/shop', (req, res) =>{
    storeService.getPublishedItems()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({message: err}));
})

// route to get all items
app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({message: err}))
})

// route to get all categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({message: err}))
});

// error-handler for unmatched routes- sends custom 404 page
app.use((req, res) =>{
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// run the server only if the initialize function in store-service.js is successful
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express HTTP server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Unable to Start the Server", err);
    });