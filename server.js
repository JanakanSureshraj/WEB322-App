const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// server listens on port 8080
app.listen(PORT, () =>{
    console.log(`Express HTTP server listening on port ${PORT}`);
})

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

