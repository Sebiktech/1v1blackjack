var socket = io();

socket.on('list games', function(games){
    for (let i = 0; i < games.length; i++) {
        if($('#' + games[i]._id).length == 0) {
          if (socket.id == games[i].ply1.id) {
            $('#games').append(`<tr><th scope="row">${games[i].ply1.username}</th><td>${games[i].bet}</td><td><button id="${games[i]._id}" type="button" onclick="CancelGame('${games[i]._id}')" class="join btn btn-danger">Cancel</button></td></tr>`)
          } else {
            $('#games').append(`<tr><th scope="row">${games[i].ply1.username}</th><td>${games[i].bet}</td><td><button id="${games[i]._id}" type="button" onclick="JoinGame('${games[i]._id}')" class="join btn btn-success">Join</button></td></tr>`)
          }
        }
    }
})

socket.on('change balance', function (balance) {
  $("#balance").html(balance)
})

socket.on('New Game', function (id, opponent, cards, total){
  console.log(opponent)
    $('.game-content').append(`
      <div id="g-${id}" class="card m-3">
        <div id="gh-${id}" class="card-header">
          <p>${opponent.uname}</p>
          <a class="btn text-end" data-bs-toggle="collapse" href="#game-${id}" role="button" aria-expanded="false" aria-controls="game-${id}"><i class="fa-solid fa-caret-down"></i></a>
        </div>
        <div class="card-body collapse" id="game-${id}">
          <div>
            <div id="oc-${id}"></div>
            <span class="rounded" id="to-${id}">-</span>
            <div id="yc-${id}"><img width="125px" height="182" src="/static/img/cards/${cards[0]}.png" alt=""><img width="125px" height="182" src="/static/img/cards/${cards[1]}.png" alt=""></div>
            <span class="rounded" id="ty-${id}">${total}</span>
            <div id="a-${id}">
              <button type="button" onclick="Hit('${id}')" class="btn btn-primary">Hit</button>
              <button type="button" onclick="Stand('${id}')" class="btn btn-primary">Stand</button>
            </div>
          </div>
        </div>
      </div>`)
})

socket.on('Update Game', function(id, data) {
    if (data.action == 'add card') {
        $('#yc-' + id).append(`<img width="125px" height="182" src="/static/img/cards/${data.card}.png" alt="">`)
        $('#ty-' + id).html(data.total)
    } else if (data.action == 'stand') {
        $('#a-' + id).hide(1000);
    } else if (data.action == 'show result') {
        $('#to-' + id).html(data.total)
        for (let i = 0; i < data.cards.length; i++) {
            $('#oc-' + id).append(`<img width="125px" height="182" src="/static/img/cards/${data.cards[i]}.png" alt="">`)
            $('#gh-' + id).html(`<button onclick="closeGame('${id}')"><i class="fa-solid fa-xmark"></i></button>`)
        }
    }
})

function JoinGame(id) {
    socket.emit('Join Game', id)
}

function CancelGame(id) {
  socket.emit('Cancel Game', id)
}

function Hit(id) {
    socket.emit('Action Game', id, 'hit')
    var audio = new Audio('/static/sounds/card-flip.mp3');
    audio.play();
}

function Stand(id) {
    socket.emit('Action Game', id, 'stand')
}

function closeGame(id) {
  $('#g-' + id).hide(1000).delay(1000).remove()
}

function CountTotal(cards) {
    let optional = false;
    let total = 0;
    for (let i = 0; i < cards.length; i++) {
      total = total + pack[cards[i]];
      if (pack[cards[i]] == 1 && total < 22) {
        total = total + 10;
        optional = true;
      } else if(total > 21 && optional == true) {
        total = total - 10;
      }
    }
    return total;
  }

$(document).ready(function(){
    $('#create').click(function(){
        socket.emit('Create Game', $('#bet').val(), $('#count').val())
    })
})

// Alerts

socket.on("new alert", function (color, message) {
  alert(color, message)
})

function alert(color, message) {
  $('#notification-box').append(`<div class="alert alert-${color} alert-dismissible fade show" role="alert">
    ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
    </div>`)
}
