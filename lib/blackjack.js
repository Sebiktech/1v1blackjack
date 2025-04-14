const pack = [1,2,3,4,5,6,7,8,9,10,10,10,10,1,2,3,4,5,6,7,8,9,10,10,10,10,1,2,3,4,5,6,7,8,9,10,10,10,10,1,2,3,4,5,6,7,8,9,10,10,10,10]
const games = {}

exports.create = function (ply1) {
    var deck = ShuffleDeck()
    games.push({
        id:1,
        ply1:ply1,
        ply2:null,
        hands:{
            ply1:[deck[0],deck[2]],
            ply2:[deck[1],deck[3]]
        }
    })
}

function ShuffleDeck() {
    const deck = []
    for (let i = 0; i < 311; i++) {
        const card = Math.random(0,51)
         if (CheckCardInDeck(card, deck).length <= 6) {
            deck.push(pack[card])
         }
     }
    return deck;
}

function CheckCardInDeck(card, deck) {
    const found = [];
    for (let i = 0; i < deck.length; i++) {
        if(deck[i] == card){
            found.push(i);
        }
    }
    return found;
}