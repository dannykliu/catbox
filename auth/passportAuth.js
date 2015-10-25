module.exports = function(passport, FacebookStrategy, config, mongoose){

    //every time facebook authorizes a chat user, these are the three attributes that we'll store in our mongolab account
    var chatUser = new mongoose.Schema({
        profileID: String,
        fullName: String,
        profilePic: String
    });

    //pass the modelname and the schema name into the model
    //the model are constructors of the schema definition
    //i.e, the schema defines the model object
    //documents are instances of the model object
    var userModel = mongoose.model('chatUser', chatUser);

    //BIG QUESTION, where do the objects such as USER and DONE come from??
    //Use to store user's information across multiple pages
    passport.serializeUser(function(user, done){
        //user.id is stored in the session
        //not the facebook id, but the unique mongodb id that is assigned to every record
        done(null, user.id);
    });

    //finds users' record in the database and returns it back
    //whenever access to this user is required, this function is called
    passport.deserializeUser(function(id, done){
        userModel.findById(id, function(err, user){
            //if user is found, return the user
            done(err, user);
        })
    });

    passport.use(new FacebookStrategy({
        clientID: config.fb.appID, //config.fb accesses a key in the config object, which is the JSON object from development.json
        clientSecret: config.fb.appSecret,
        callbackURL: config.fb.callBackURL,
        //profileFields is what we want returned from facebook
        profileFields: ['id', 'displayName', 'photos']
    }, function(access, refresh, profile, done){
        // Check if the user exists in our mongodb database
        // if not, create one and return the profile
        // if the user exists, simply return the profile
        //profile is the profile of the user once facebook auth is done
        userModel.findOne({'profileID:': profile.id}, function(err, result){
            if(result){
                //result contains a succesful match from the database
                //so if user is found, we will return result using the done method
                done(null, result);
            } else {
                //create a new user in our mongolab account
                var newChatUser = new userModel({
                    profileID: profile.id, //the profile.id and profile.displayName comes from the facebook documentation
                    fullName: profile.displayName,
                    profilePic: profile.photos[0].value || ''
                    //photos object is an array returned by facebook, and the first element in that array is the profile picture of the user
                });

                //now that we have a user, store it into our database
                newChatUser.save(function(err){
                    done(null, newChatUser);
                })
            }
        })

    }));

}
