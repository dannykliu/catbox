var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var config = require('./config/config.js');
var ConnectMongo = require('connect-mongo')(session);
var mongoose = require('mongoose').connect(config.dbURL);
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
//gets populated with list of rooms that the user creates
var rooms = [];


//tells express where to find all the view files
//sets up a key-value pair where the key is views and the value is the path defined by the root director and the views folder
app.set('views', path.join(__dirname, 'views'));
//use hogan templating engine instead of jade
//will allow our server to render html files directly
app.engine('html', require('hogan-express'));
//use html files in engine
app.set('view engine', 'html');
//find static files like css and and images
app.use(express.static(path.join(__dirname, 'public'))); // ./public
//appends public folder onto the root directory to look for static files
//track user sessions
app.use(cookieParser());
//change between development and production mode. In terminal, type: export NODE_ENV=production

var env = process.env.NODE_ENV || 'development';
if(env === 'development'){
    app.use(session({secret: config.sessionSecret})); //enable the session
} else {
    //sessions cannot be stored in the default because then you can only have one session
    //and we want to track multiple sessions
    app.use(session({
        secret: config.sessionSecret,
        store: new ConnectMongo({ //stores sessions into our database so we can have multiple sessions
            //url: config.dbURL, replace with following line bc mongoose creates its own connection already
            mongoose_connection: mongoose.connections[0],
            stringify: true
        })
    }));
}

//do this to get passport working
app.use(passport.initialize());
app.use(passport.session());

//since auth.js returns a function, we will invoke that function
require('./auth/passportAuth.js')(passport, FacebookStrategy, config, mongoose);
//call the routes.js module into our app
require('./routes/routes.js')(express, app, passport, config, rooms);

// //Makes app work on port 3000
// app.listen(3000, function(){
//     console.log("ChatCat working on port 3000");
//     console.log("Mode: " + env);
// })

/* Configuring  Express app to use socket.io */
//If we have a port defined, use it, if not, use 3000
app.set('port', process.env.PORT || 3000);
//create our own http server and pass in the express app
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
require('./socket/socket.js')(io, rooms);

server.listen(app.get('port'), function(){
    console.log('ChatCAT on port ' + app.get('port'));
})
