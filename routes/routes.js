module.exports = function(express, app, passport, config, rooms){
    var router = express.Router();

    //next is other routes in the application
    router.get('/', function(req, res, next){
        //render knows where to look for the folder because we set it to the views folder in line 7
        res.render('index', {title: 'Welcome to ChatCAT'});
    })

    //Fixing problem that users can somehow access internal pages of the app even though they're not authenticated
    function securePages(req, res, next){
        //Therefore only let user go to the next page if they're authenticated
        if(req.isAuthenticated()){
            next();
        } else {
            res.redirect('/');
        }
    }
    //must pass in reference to passport because it is an external module
    router.get('/auth/facebook', passport.authenticate('facebook'));

    router.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/chatrooms',
        failureRedirect: '/'
    }));

    router.get('/chatrooms', securePages, function(req, res, next){
        //But where does the user variable come from???
        //The first config is the name of the variable
        //The second config is the reference to the config passed into routes.js
        res.render('chatrooms', {title: 'Chatrooms', user: req.user, config: config})
        //pass user data to chatrooms page so you can use it there
    })

    router.get('/room/:id', securePages, function(req, res, next){
        var room_name = findTitle(req.params.id);
        //all the colons you use are objects that can be extracted with req.params.___
        res.render('room', {user: req.user, room_number: req.params.id, room_name: room_name, config: config});
    })

    router.get('/logout', function(req, res, next){
        req.logout();
        res.redirect('/');
    });

    function findTitle(room_id){
        var n = 0;
        while(n < rooms.length){
            if(rooms[n].room_number == room_id){
                return rooms[n].room_name;
                break;
            } else {
                n++;
                continue;
            }
        }
    }

    // //for demonstrating the sessions
    // router.get('/setcolor', function(req, res, next){
    //     req.session.favColor = "Red";
    //     res.end('Setting favorite color!');
    // })
    // router.get('/getColor', function(req, res, next){
    //     res.send('Favorite color: ' + (req.session.favColor === undefined ? "Not found" :req.session.favColor));
    // })

    //default route is to go to the /, which will go to the index page
    app.use('/', router);
}
