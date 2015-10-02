function init() {

  var serverBaseUrl = document.domain;

  /*
   On client init, try to connect to the socket.IO server.
   Note we don't specify a port since we set up our server
   to run on port 8080
   */
  var socket = io.connect(serverBaseUrl);

  //We'll save our session ID in a variable for later
  var sessionId = '';

  var initGame = false;
  var responseCounter = 0;

  //Helper function to update the participants' list
  function updateParticipants(participants) {
    $('#participants').html('');
    for (var i = 0; i < participants.length; i++) {
      $('#participants').append('<span id="' + participants[i].id + '">' +
        participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
    }
  }

  /*
   When the client successfully connects to the server, an
   event "connect" is emitted. Let's get the session ID and
   log it. Also, let the socket.IO server there's a new user
   with a session ID and a name. We'll emit the "newUser" event
   for that.
   */
  socket.on('connect', function () {
    sessionId = socket.io.engine.id;
    console.log('Connected ' + sessionId);
    $('#messages').append('<b>' + 'Connection Successful' + '<hr />');
    $('#messages').append('<b>' + "Welcome to The Wizard Guru's Chat Server" + '<hr />');
    $('#messages').append('<b>' + "Would you like to play a game (y/n) ?" + '<hr />');
    socket.emit('newUser', {id: sessionId, name: $('#name').val()});
  });

  /*
   When the server emits the "newConnection" event, we'll reset
   the participants section and display the connected clients.
   Note we are assigning the sessionId as the span ID.
   */
  socket.on('newConnection', function (data) {
    updateParticipants(data.participants);
  });

  /*
   When the server emits the "userDisconnected" event, we'll
   remove the span element from the participants element
   */
  socket.on('userDisconnected', function(data) {
    $('#' + data.id).remove();
  });

  /*
   When the server fires the "nameChanged" event, it means we
   must update the span with the given ID accordingly
   */
  socket.on('nameChanged', function (data) {
    $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
  });

  /*
   When receiving a new chat message with the "incomingMessage" event,
   we'll prepend it to the messages section
   */
  socket.on('incomingMessage', function (data) {
    var message = data.message;
    var name = data.name;
    var room = data.room
    console.log(data.room);

    

        $('#messages').append('<b>' + name + '</b><br />' + message  + '<hr />');
        checkMessage(message);
        var objDiv = document.getElementById("messages");
        objDiv.scrollTop = objDiv.scrollHeight;
 
  });

  /*
   Log an error if unable to connect to server
   */
  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  /*
   "sendMessage" will do a simple ajax POST call to our server with
   whatever message we have in our textarea
   */
  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = $('#name').val();
    var roomselect = 'abc';//$( '#roomselect option:selected' ).text;
    console.log(roomselect);
    $.ajax({
      url:  '/message',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({message: outgoingMessage, name: name, room: roomselect})
    });
  }

  function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
  }

  function checkMessage (message) {
    if(message.toUpperCase() == 'Y')
    {
      responseCounter += 1;
      
      if(responseCounter == 1)
      {
        $('#messages').append('<b>' + "Okay, lets roll a die and see who has a higher roll. Your up first." + '<hr />');
        $('#messages').append('<b>' + "Press 'y' when your ready to roll your die." + '<hr />');
      }
      else if(responseCounter == 2)
      {
        var rollVal = randomInt(1,6);
        $('#messages').append('<b>' + "You rolled a " + rollVal + '. Now its Wizard Gamebots turn' + '<hr />');
        $('#messages').append('<b>' + "Wizard Gamebot is rolling..." + '<hr />');
        setTimeout(function() {
          var botRollVal = randomInt(1,6);
          $('#messages').append('<b>' + "Wizard Gamebot rolled a " + botRollVal + '<hr />');
          updateScrollView();

          setTimeout(function() {
            if(rollVal > botRollVal)
            {
              $('#messages').append('<b>' + "Argh, you won!! I'll beat you next time!" + '<hr />');
              $('#messages').append('<b>' + "Would you like to play again (y/n)?" + '<hr />');
            }
            else if ( rollVal < botRollVal)
            {
              $('#messages').append('<b>' + "The Gamebot prevails once again!!" + '<hr />');
              $('#messages').append('<b>' + "Would you like to play again (y/n)?" + '<hr />');
            }
            else
            {
              $('#messages').append('<b>' + "Tie! Lets roll the die again." + '<hr />');
              $('#messages').append('<b>' + "Press y to roll again." + '<hr />');
            }
            updateScrollView();
          },4250);
          
        },8250);
        responseCounter = 0;
      }
    }
    if(message.toUpperCase() == 'N')
    {
       $('#messages').append('<b>' + "Okay. Start inviting users to chat with!" + '<hr />');
    }
  }
 
 function updateScrollView() {
      var objDiv = document.getElementById("messages");
      objDiv.scrollTop = objDiv.scrollHeight;
    }
  /*
   If user presses Enter key on textarea, call sendMessage if there
   is something to share
   */
  function outgoingMessageKeyDown(event) {
    if (event.which == 13) {
      event.preventDefault();
      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }

  /*
   Helper function to disable/enable Send button
   */
  function outgoingMessageKeyUp() {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
  }

  /*
   When a user updates his/her name, let the server know by
   emitting the "nameChange" event
   */
  function nameFocusOut() {
    var name = $('#name').val();
    socket.emit('nameChange', {id: sessionId, name: name});
  }

  /* Elements setup */
  $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', sendMessage);

}

$(document).on('ready', init);
