module.exports = function(io, rooms){
    var chatrooms = io.of('/roomlist').on('connection', function(socket){
        console.log("Connection established on the server");
        //restablish the connection even after refreshing the page
        socket.emit('roomupdate', JSON.stringify(rooms));

        //hear the event from script tag in chatrooms.html
        socket.on('newroom', function(data){
            //the data is the object we created in the sockets.emit line
            rooms.push(data); //appends data into the rooms array
            //broadcast to all other users in the chatrooms view except the user who created the room
            socket.broadcast.emit('roomupdate', JSON.stringify(rooms));
            //now we broadcast also the the user who created the room
            socket.emit('roomupdate', JSON.stringify(rooms));
        })
    })

    var messages = io.of('/messages').on('connection', function(socket){
        console.log("Connected to the chatroom!");
        socket.on('joinroom', function(data){
            socket.username = data.user;
            socket.userPic = data.userPic;
            //push the user data into the partition (room)
            socket.join(data.room);
            updateUserList(data.room, true);
        })

        socket.on('newMessage', function(data){
            //will only be received by other users in the same room
            socket.broadcast.to(data.room_number).emit('messagefeed', JSON.stringify(data));
        })

        function updateUserList(room, updateAll){
            //get the data back from room
            var getUsers = io.of('/messages').clients(room);
            //will return an object that contains all the active users and their userPics
            var userList = [];
            for(var i in getUsers){
                //username is coming from socket.username = data.user
                userList.push({user: getUsers[i].username, userPic: getUsers[i].userPic});
            }
            socket.to(room).emit('updateUsersList', JSON.stringify(userList));
            //Will forcefully update list of users for all members in a particular chatroom
            if(updateAll){
                socket.broadcast.to(room).emit('updateUsersList', JSON.stringify(userList));
            }
        }

        socket.on('updateList', function(data){
            updateUserList(data.room);
        })

    })
}
