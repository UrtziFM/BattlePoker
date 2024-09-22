let playedTimes = 0;
let maxBetHit = false;
let dblBets = false;
let hasRaised = false;
localStorage.setItem("completeCards", JSON.stringify(cards));
const activeCards = JSON.parse(localStorage.getItem("completeCards"));
const handHeirarchy = ["high-card", "pair", "two-pairs", "three-of-a-kind", "straight", "flush", "full-house", "four-of-a-kind", "straight-flush", "royal-flush"];
const cardHeirarchy = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king", "ace"];
const suitArr = ["diamonds", "hearts", "clubs", "spades"];
const playersDetails = ["playerHandDetails", "playerTwoHandDetails", "playerThreeHandDetails", "playerFourHandDetails"];
const playerIds = ["playerCards", "playerTwoCards", "playerThreeCards", "playerFourCards"];
const gameStepHierarchy = ["zeroPlaceholder", "pre flop", "flop", "turn", "river"];
let usedCardsArr = [];
let communityCardsHTML = "";
/*looking for pairs*/
plyr1Pair = [];
plyr2Pair = [];
plyr3Pair = [];
plyr4Pair = [];
let player0Obj;
let player1Obj;
let player2Obj;
let player3Obj;
const playersHands = [player0Obj, player1Obj, player2Obj, player3Obj];
let bestHoleCards = [];
let resultList = [0, 0, 0, 0];
let compareCards = [0, 0, 0, 0];
let activePlayers = [0, 1, 2, 3];
let playerHighCards = [0, 0, 0, 0];
let playerStraightHighCard = [0, 0, 0, 0];
let topHand;
const plyr = "<i class='fas fa-user'></i> ";
const yourDetails = document.querySelector("[data-player='0']");
const messageElement = document.getElementById("message");
let communityCards = [];
/*If there is money in localstorage it keeps but reset if it is not*/
let thePot = 0;
let playerMoney = localStorage.getItem('balance');
playerMoney = playerMoney ? parseInt(playerMoney) : 500;


document.querySelector("#playerMoney").innerHTML = playerMoney;

let bet = 0;
let gameIncrement = 1;
let updatedBets = false;
let maxBet = [100, 200, 300];/*start random bet */
let bet1 = Math.floor(Math.random() * (maxBet[0] - 1 + 1) + 10);
let bet2 = Math.floor(Math.random() * (maxBet[1] - maxBet[0] + 1) + maxBet[0]);
let bet3 = Math.floor(Math.random() * (maxBet[2] - maxBet[1] + 1) + maxBet[1]);
let monetaryVal = [null, 10, bet1, bet2, bet3];

function setPlayerMoney(winLoseBet) {
    playerMoney = isNaN(playerMoney) ? 500 : playerMoney;
    document.getElementById("betTarget").innerHTML = "Bet $" + bet;
    document.getElementById("playerMoney").innerHTML = playerMoney;
    document.querySelector("#playerMoney").innerHTML = playerMoney;/*SAFARI BUG NEEDS BOTH*/
    localStorage.setItem("balance", playerMoney);
    return false;
}

// Not negative balance, no debts for the player unless he accepts to restart again
function resetPlayerMoney() {
    if (playerMoney <= 0) {
        // Tell player he is out
        const confirmation = confirm("You are broken so I guess you didn't DO THE MATH, do you want to start again?");

        if (confirmation) {
            // Once confirmed restart
            playerMoney = 500;
            localStorage.setItem('balance', playerMoney);
            document.querySelector("#playerMoney").innerHTML = playerMoney;
            alert("Your Balance is again $500. ¡This time DO THE MATH!");
        } else {
            // Disable the game unless get player confirmation
            alert("The game is disabled, please refresh the page to start again.");
            disableGame(); 
        }
    }
}

function disableGame() {
    const buttonsToDisable = [
        "[data-round='match']",
        "[data-round='raise']",
        "[data-round='check']",
        "[data-round='max']",
        "#foldBt",
        "button[title='Deal']"
    ];
    buttonsToDisable.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled'); 

            // Eliminate previous events
            button.onclick = (event) => {
                event.preventDefault(); 
                event.stopPropagation();
                return false;
            };
        });
    });
    document.getElementById("betTarget").innerHTML = "The game is disabled";
}


function showPlayersCards() {
    for (let i = 0; i < 4; i++) {
        let playerCardsHTML = "";
        for (let j = 0; j < playersHands[i].length; j++) {
            playerCardsHTML = playerCardsHTML + "<div class='card " + playersHands[i][j].value + "-" + playersHands[i][j].suit + "' ></div>";
            document.getElementById(playerIds[i]).innerHTML = playerCardsHTML;
        }
    }
}

function generate(activeCards) {
    return Math.floor(Math.random() * activeCards.length);
}

function buildCommunityCards(howMany, step) {
    while (communityCards.length < howMany) {
        let genNumber = generate(activeCards);
        if (usedCardsArr.indexOf(activeCards[genNumber].title) === -1) {
            communityCardsHTML = communityCardsHTML + `<div class='card ${activeCards[genNumber].title}' ></div>`;
            communityCards.push({
                suit: activeCards[genNumber].title.substring(activeCards[genNumber].title.indexOf("-") + 1, activeCards[genNumber].title.length),
                value: activeCards[genNumber].title.substring(0, activeCards[genNumber].title.indexOf("-"))
            });
            usedCardsArr.push(cards[genNumber].title);
        }
    }
    document.getElementById("communityCards").innerHTML = communityCardsHTML;
    //if (step === 2) document.getElementById("communityCardDetails").innerHTML = "Community Cards";
}

function getOccurrence(list, value) {/*start how many times number in array*/
    var count = 0;
    list.forEach((v) => (v === value && count++));
    return count;
}

function clear(action) {
    if (action === "fold") {
        document.getElementById("notification").classList.remove("alert-success");
        document.getElementById("notification").classList.add("alert-danger");
        document.getElementById("playerHandDetails").classList.remove("alert-success");
        document.getElementById("playerHandDetails").classList.add("alert-danger");
        document.getElementById("playerHandDetails").innerHTML = "You folded.";
        showPlayersCards();
    }
    document.getElementById("foldBt").classList.add("hide");
    document.querySelector("[data-round='max']").classList.add("hide");
    document.querySelector("[data-round='match']").classList.add("hide");
    document.querySelector("[data-round='raise']").classList.add("hide");
    document.querySelector("[data-round='check']").classList.add("hide");
    document.getElementById("status").classList.add("hide");
    document.querySelector("button[title='Deal']").disabled = false;
    document.querySelector("button[title='Deal']").classList.remove("hide");
}

function fold() {
    document.getElementById("betTarget").innerHTML = "Folded. You lost $" + bet + ". Place your bet.";
    buildCommunityCards(5, "default");
    document.querySelector("[data-round='max']").disabled = true;
    document.querySelector("[data-round='raise']").disabled = true;
    document.querySelector("[data-round='match']").disabled = true;
    document.querySelector("[data-round='check']").disabled = true;
    clear("fold");
    window.location = "#";
}

function youWin(type) {
    if (type === "split") {
        thePot = (thePot / 2);
        document.getElementById("betTarget").innerHTML = "SPLIT POT";
        messageElement.innerHTML = "Split pot. You Won $" + thePot;
    } else {
        messageElement.innerHTML = "You Won $" + thePot;
        document.getElementById("betTarget").innerHTML = "TEXAS HOLDEM";
    }
    document.getElementById("foldBt").classList.add("hide");
    document.querySelector("[data-round='max']").classList.add("hide");
    document.querySelector("[data-round='match']").classList.add("hide");
    document.querySelector("[data-round='check']").classList.add("hide");
    document.querySelector("[data-round='raise']").classList.add("hide");
    document.querySelector("[data-player='0']").classList.remove("alert-info");
    document.querySelector("[data-player='0']").classList.remove("alert-danger");
    document.querySelector("[data-player='0']").classList.add("alert-success");
    document.querySelector("button[title='Deal']").disabled = false;
    document.querySelector("button[title='Deal']").classList.remove("hide");
    yourDetails.classList.remove("alert-info");
    yourDetails.classList.add("alert-success");
    document.querySelector("#notification").classList.remove("alert-info");
    document.querySelector("#status").classList.remove("hide");
    document.getElementById("notification").classList.add("alert-success");
    playerMoney = playerMoney + thePot;
    setPlayerMoney("win");
    document.getElementById("playerMoney").classList.remove("hide");
    document.querySelector("#playerMoney").innerHTML = playerMoney;
    return false;
}

function youLose(topHand) {
    document.querySelector("[data-player='" + topHand + "']").classList.remove("alert-info");
    document.querySelector("[data-player='" + topHand + "']").classList.add("alert-success");
    document.getElementById("status").classList.remove("hide");
    messageElement.classList.remove("hide");
    messageElement.innerHTML = "You lost $" + bet;
    document.querySelector("[data-player='0']").classList.remove("alert-success");
    document.querySelector("[data-player='0']").classList.remove("alert-info");
    document.querySelector("[data-player='0']").classList.add("alert-danger");
    document.getElementById("notification").classList.remove("alert-success");
    document.getElementById("notification").classList.remove("alert-info");
    document.getElementById("notification").classList.add("alert-danger");
    document.getElementById("betTarget").innerHTML = "Place your bet.";
    document.querySelector("[data-round='check']").classList.add("hide");
    document.getElementById("foldBt").classList.add("hide");
    document.querySelector("[data-round='max']").classList.add("hide");
    document.querySelector("[data-round='match']").classList.add("hide");
    document.querySelector("[data-round='check']").classList.add("hide");
    document.querySelector("[data-round='raise']").classList.add("hide");
    document.querySelector("button[title='Deal']").disabled = false;
    document.querySelector("button[title='Deal']").classList.remove("hide");
    return false;
}

function removeActivePlyr(plyrID) {
    plyrID = Number(plyrID)
    compareCards[plyrID] = -1;
    resultList[plyrID] = -1;
    let tempActivePlayer = [];
    for (let i = 0; i < activePlayers.length; i++) {
        if (activePlayers[i] !== plyrID) {
            tempActivePlayer.push(activePlayers[i]);
        }
    }
    activePlayers = tempActivePlayer;
    if (activePlayers == 0) {
        youWin("default");
    }
}

function evaluateHand(iteration, gameStep) {
    let stepPlayed = false;
   
   /* const communityCardDetailsElement = document.getElementById("communityCardDetails");
    if (communityCardDetailsElement) {
        communityCardDetailsElement.innerHTML = "The " + gameStepHierarchy[gameStep] + " - Pot: $" + thePot;
    }

    const raiseAmtElement = document.getElementById("raiseAmt");
    if (raiseAmtElement) {
        raiseAmtElement.innerHTML = "$" + (monetaryVal[gameIncrement + 1] * 2);
    }

    const maxButtonElement = document.querySelector("[data-round='max']");
    if (maxButtonElement) {
        maxButtonElement.innerHTML = "Max $" + (monetaryVal[gameIncrement + 1] * 3);
    } */
    
    countingIterations = iteration;
    let cardsInvolved = "";
    let cardIndexes = [];
    let cardsArr = [playersHands[iteration][0], playersHands[iteration][1]];
    if (gameStep === 2) {
        cardsArr = [playersHands[iteration][0], playersHands[iteration][1], communityCards[0], communityCards[1], communityCards[2]];
    }
    if (gameStep === 3) {
        cardsArr = [playersHands[iteration][0], playersHands[iteration][1], communityCards[0], communityCards[1], communityCards[2], communityCards[3]];
    }
    if (gameStep === 4) {
        cardsArr = [playersHands[iteration][0], playersHands[iteration][1], communityCards[0], communityCards[1], communityCards[2], communityCards[3], communityCards[4]];
    }
    let highCard;
    let flush = false;
    let straight = false;
    let spades = 0;
    let hearts = 0;
    let diamonds = 0;
    let clubs = 0;
    let two = 0;
    let three = 0;
    let four = 0;
    let five = 0;
    let six = 0;
    let seven = 0;
    let eight = 0;
    let nine = 0;
    let ten = 0;
    let jack = 0;
    let queen = 0;
    let king = 0;
    let ace = 0;
    for (let i = 0; i < cardsArr.length; i++) {
        if (cardHeirarchy.indexOf(cardsArr[i].value) !== null) {
            cardIndexes.push(cardHeirarchy.indexOf(cardsArr[i].value));
        }
        if (cardsArr[i].value === "ace") {
            cardIndexes.push(-1);/*aces need representation for a straight ace to 4 concept. -1 will work because 2 is represented as 0. This is just used for determining a straight*/
        }
        if (cardsArr[i].value === "two") {
            two = two + 1;
        }
        if (cardsArr[i].value === "three") {
            three = three + 1;
        }
        if (cardsArr[i].value === "four") {
            four = four + 1;
        }
        if (cardsArr[i].value === "five") {
            five = five + 1;
        }
        if (cardsArr[i].value === "six") {
            six = six + 1;
        }
        if (cardsArr[i].value === "seven") {
            seven = seven + 1;
        }
        if (cardsArr[i].value === "eight") {
            eight = eight + 1;
        }
        if (cardsArr[i].value === "nine") {
            nine = nine + 1;
        }
        if (cardsArr[i].value === "ten") {
            ten = ten + 1;
        }
        if (cardsArr[i].value === "jack") {
            jack = jack + 1;
        }
        if (cardsArr[i].value === "queen") {
            queen = queen + 1;
        }
        if (cardsArr[i].value === "king") {
            king = king + 1;
        }
        if (cardsArr[i].value === "ace") {
            ace = ace + 1;
        }
        if (cardsArr[i].suit === "spades") {  /*determine same suits*/
            spades = spades + 1;
        }
        if (cardsArr[i].suit === "hearts") {
            hearts = hearts + 1;
        }
        if (cardsArr[i].suit === "diamonds") {
            diamonds = diamonds + 1;
        }
        if (cardsArr[i].suit === "clubs") {
            clubs = clubs + 1;
        }
    }
    let valueArr = [two, three, four, five, six, seven, eight, nine, ten, jack, queen, king, ace]; /*Determine matching values*/
    let lastIteration = activePlayers[activePlayers.length - 1];
    for (let i = 0; i < valueArr.length; i++) {
        if (valueArr[i] > 0) {//determine highest card
            highCard = cardHeirarchy[i];
            if (gameStep === 1) {
                playerHighCards[iteration] = i;
            }
            if (resultList[iteration] === 0) {
                highCard = " - " + cardHeirarchy[valueArr.lastIndexOf(1)];
                compareCards[iteration] = i;
            }
        }
        if (valueArr[i] === 2) {//a pair           /*collect pair for later eval*/           
            if (iteration === 0) { plyr1Pair.push(i) }
            if (iteration === 1) { plyr2Pair.push(i) }
            if (iteration === 2) { plyr3Pair.push(i) }
            if (iteration === 3) { plyr4Pair.push(i) }/*end pair collection*/
            if (resultList[iteration] < 1) {
                resultList[iteration] = 1;
                compareCards[iteration] = valueArr.lastIndexOf(2);
            }
            cardsInvolved = cardsInvolved + " - " + cardHeirarchy[i] + "s";
        }
        if (valueArr[i] === 3) {//three of a kind
            if (resultList[iteration] < 3) {
                resultList[iteration] = 3;
                compareCards[iteration] = valueArr.lastIndexOf(3);
                cardsInvolved = cardsInvolved + " - " + cardHeirarchy[valueArr.lastIndexOf(3)] + "s";
            }
        }
        if (valueArr[i] === 4) {
            if (resultList[iteration] < 7) {
                resultList[iteration] = 7;
                compareCards[iteration] = valueArr.lastIndexOf(4);
                cardsInvolved = cardsInvolved + " - " + cardHeirarchy[valueArr.lastIndexOf(4)] + "s";
            }
        }
    }
    if (getOccurrence(valueArr, 2) > 1) {//2 pair - if the number 2 occurs more than once
        if (resultList[iteration] < 2) {
            resultList[iteration] = 2;
            compareCards[iteration] = valueArr.lastIndexOf(2);
        }
    }/*LOOKING FOR A STRAIGHT*/
    cardIndexes = cardIndexes.sort(((a, b) => a - b));
    let connectedTwo = false;
    let connectedThree = false;
    let connectedFour = false;
    for (var i = 0; i < cardIndexes.length; i++) {
        if (cardIndexes[i + 1] === cardIndexes[i] + 1) {
            connectedTwo = true;
        }
        if (cardIndexes[i + 1] === cardIndexes[i] + 1 && cardIndexes[i + 2] === cardIndexes[i] + 2) {
            connectedThree = true;
        }
        if (cardIndexes[i + 1] === cardIndexes[i] + 1 && cardIndexes[i + 2] === cardIndexes[i] + 2 && cardIndexes[i + 3] === cardIndexes[i] + 3) {
            connectedFour = true;
        }
        if (cardIndexes[i + 1] === cardIndexes[i] + 1 && cardIndexes[i + 2] === cardIndexes[i] + 2 && cardIndexes[i + 3] === cardIndexes[i] + 3 && cardIndexes[i + 4] === cardIndexes[i] + 4) {
            straight = true;
            if (cardIndexes[i + 4] > playerStraightHighCard[iteration]) {
                playerStraightHighCard[iteration] = cardIndexes[i + 4];
            }

            if (resultList[iteration] < 4) {
                resultList[iteration] = 4;
                communityCards[iteration] = cardIndexes[i + 4];
            }
        }
    }
    for (let i = -1; i < 13; i++) {/*ATTEMPT TO FIX PAIRS OVERRIDING STRAIGHT*/
        if (valueArr[i] > 0 && valueArr[i + 1] > 0 && valueArr[i + 2] > 0 && valueArr[i + 3] > 0 && valueArr[i + 4] > 0) {
            resultList[iteration] = 4;
            communityCards[iteration] = valueArr[i + 4];
            straight = true;
        }
    }/*END ATTEMPT*/
    if (resultList[iteration] < 4 && straight === true) {//declared earlier as well
        resultList[iteration] = 4;
    }
    let suitedArr = [spades, hearts, diamonds, clubs];
    if (suitedArr.indexOf(5) !== -1) {    /*DETERMINE A flush*/
        flush = true;
        if (resultList[iteration] < 5) {
            resultList[iteration] = 5;
        }
    }
    if (valueArr.indexOf(3) !== -1 && valueArr.indexOf(2) !== -1) {    /*checking for full house*/
        if (resultList[iteration] < 6) {
            resultList[iteration] = 6;
            communityCards[iteration] = valueArr.lastIndexOf(3);
            cardsInvolved = cardHeirarchy[valueArr.lastIndexOf(2)] + "s - " + cardHeirarchy[valueArr.lastIndexOf(3)] + "s";
        }
    }
    if (flush === true && straight === true) {/*checking for straight flush*/
        if (resultList[iteration] < 8) {
            resultList[iteration] = 8;
        }
    }
    if (valueArr[8] > 0 && valueArr[9] > 0 && valueArr[10] > 0 && valueArr[11] > 0 && valueArr[12] > 0 && flush === true) {  /*checking for royal flush (valueArr[valueArr.length - 1] is an ace)*/
        if (resultList[iteration] < 9) {
            resultList[iteration] = 9;
        }
    }
    for (let i = 0; i < 4; i++) {
        if (activePlayers.indexOf(i) === -1) {
            resultList[i] = -1;
            compareCards[i] = -1;
        }
    }
    document.getElementById(playersDetails[iteration]).classList.remove("hide");
    let HighCardMessage = "";
    if (resultList[iteration] === 0) {
        compareCards[iteration] = valueArr.lastIndexOf(1);
        HighCardMessage = " - " + cardHeirarchy[valueArr.lastIndexOf(1)];
    }
    if (iteration === 0) {
        document.getElementById(playersDetails[iteration]).innerHTML = "You have: " + handHeirarchy[resultList[iteration]] + "  " + cardsInvolved + HighCardMessage;
        document.querySelector("#" + playersDetails[iteration]).innerHTML = "You have: " + handHeirarchy[resultList[iteration]] + "  " + cardsInvolved + HighCardMessage;/*browser bug fix*/
    }
    if (iteration !== 0 && gameStep === 4 && activePlayers.indexOf[iteration] !== -1) {
        document.getElementById(playersDetails[iteration]).innerHTML = plyr + "Player " + (iteration + 1) + ": " + handHeirarchy[resultList[iteration]] + "  " + cardsInvolved + HighCardMessage;
        document.querySelector("#" + playersDetails[iteration]).innerHTML = plyr + "Player " + (iteration + 1) + ": " + handHeirarchy[resultList[iteration]] + "  " + cardsInvolved + HighCardMessage;        /*browser bug fix*/
    }


    //START BEST WHOLE CARDS
    if (gameStep === 1) {
        //bestHoleCards.push()
        let tempObj = []
        for (let i = 0; i < valueArr.length; i++) {
            if (valueArr[i] !== 0) {
                tempObj.push(i);
                if (valueArr[i] > 1) {
                    tempObj.push(i);
                }
            }
        }
        let placeHdlr0 = tempObj[0];
        let placeHdlr1 = tempObj[1];
        if (tempObj[1] < tempObj[0]) {
            tempObj[0] = placeHdlr1;
            tempObj[1] = placeHdlr0;
        }
        // tempObj = tempObj.reverse();
        //  tempObj = tempObj.sort();
        bestHoleCards.push(tempObj);



    }

    //END BEST WHOLE CARDS

    if (gameStep === 4 && iteration === lastIteration) {








        if (getOccurrence(valueArr, 2) > 2) {/*player cannot have 3 pair. Get rid of lowest pair here*/
            for (let i = 0; i < valueArr.length; i++) {
                if (valueArr[i] === 2 && getOccurrence(valueArr, 2) > 2) {
                    valueArr[i] = -2;
                }
            }
        }
        let winningHand = Math.max(...resultList);
        let winningCard;
        if (getOccurrence(resultList, winningHand) === 1) {
            topHand = resultList.indexOf(winningHand);
        } else {
            for (let i = 0; i < resultList.length; i++) {
                if (resultList[i] !== winningHand) {
                    compareCards[i] = -1;
                    bestHoleCards[i][0] = -1;
                    bestHoleCards[i][1] = -1;

                }

            }

            winningCard = Math.max(...compareCards);
            topHand = compareCards.indexOf(winningCard);
            if (getOccurrence(compareCards, winningCard) > 1) {
                if (winningHand === 4) {/*determine who has the highest straight */
                    topHand = Math.max(...playerStraightHighCard);
                    if (getOccurrence(playerStraightHighCard, topHand) > 1 && playerStraightHighCard[0] === topHand) {
                        youWin("split");
                        showPlayersCards();
                        return false;
                    }

                }
                if (winningHand === 2) {              /* If the 2 winning players have two pair, who has the best 2 pair?*/
                    let allPairs = [...plyr1Pair, ...plyr2Pair, ...plyr3Pair, ...plyr4Pair];
                    let highestPair = Math.max(...allPairs);
                    const playersWithPair = [plyr1Pair, plyr2Pair, plyr3Pair, plyr4Pair];//take out player without high pair
                    for (let i = 0; i < 4; i++) {
                        if (playersWithPair[i].indexOf(highestPair) === -1) {
                            compareCards[i] = -1;
                            resultList[i] = -1;
                            playersWithPair[i] = [];
                        }
                    }
                    for (let i = 0; i < allPairs.length; i++) {
                        if (allPairs[i] === highestPair) {
                            allPairs[i] = -1;
                        }
                    }
                    let secondHighestPair = Math.max(...allPairs);
                    for (let i = 0; i < 4; i++) {
                        if (playersWithPair[i].indexOf(secondHighestPair) === -1) {
                            compareCards[i] = -1;
                            resultList[i] = -1;
                            playersWithPair[i] = [-1];
                        }
                    }

                }   /*end*/

                let winnersList = [];
                for (let i = 0; i < 4; i++) {
                    if (compareCards[i] !== -1) {
                        let tempPlayerCards = [cardHeirarchy.indexOf(playersHands[i][0].value), cardHeirarchy.indexOf(playersHands[i][1].value)];
                        let tempWinner = Math.max(...tempPlayerCards);
                        winnersList.push(tempWinner);
                    } else {
                        winnersList.push(-1);
                    }
                }
                multiWinMax = Math.max(...winnersList);
                topHand = winnersList.indexOf(multiWinMax);


                if (getOccurrence(winnersList, multiWinMax) > 1) {


                    let hiHole = 0;
                    let lowHole = 0;
                    for (let i = 0; i < bestHoleCards.length; i++) {

                        if (bestHoleCards[i].indexOf(multiWinMax) === -1) {
                            bestHoleCards[i][0] = -1;
                            bestHoleCards[i][1] = -1;

                        }

                        if (bestHoleCards[i][1] > hiHole) {
                            hiHole = bestHoleCards[i][1];
                            topHand = i;

                        }
                        if (bestHoleCards[i][1] === hiHole) {

                            if (bestHoleCards[i][0] > lowHole) {
                                lowHole = bestHoleCards[i][0];
                                topHand = i;

                            }
                            if (bestHoleCards[i][1] === hiHole && bestHoleCards[i][0] === lowHole && bestHoleCards[0][0] !== -1) {
                                youWin("split");
                                showPlayersCards();
                                return false;

                            }
                        }


                    }



                }
                /*    if (getOccurrence(winnersList, multiWinMax) > 1 && compareCards[0] === multiWinMax) {
                        youWin("split");
                        showPlayersCards();
                        return false;
                    }*/
            }
        }
    }
    let highCardCount = 0;  /*FIRST ROUND*/
    for (let i = 0; i < valueArr.length; i++) {
        if (i > 7 && valueArr[i] > 0) {
            highCardCount = highCardCount + 1;
        }
    }
    let firstRoundSuited = false;
    let threeSuited = false;
    let fourSuited = false;
    for (let i = 0; i < suitedArr.length; i++) {/*determine if the first round has match suit*/
        if (suitedArr[i] > 1) {
            firstRoundSuited = true;
        }
        if (suitedArr[i] > 2) {
            threeSuited = true;
        }
        if (suitedArr[i] > 3) {
            fourSuited = true;
        }
    }


    ///let cardsArr = [playersHands[iteration][0], playersHands[iteration][1]];

    /*END OF HAND EVALUATION */
    if (stepPlayed === false && activePlayers.indexOf(iteration) !== -1) {
        if (gameStep === 1 && iteration !== 0) {
            if (resultList[iteration] >= 1 || connectedTwo === true || highCardCount > 0 || firstRoundSuited === true || valueArr[12] > 0) {
                document.querySelector("[data-player='" + iteration + "']").innerHTML = plyr + "Player " + (iteration + 1) + ": bets $" + monetaryVal[gameStep + 1];
                document.querySelector("[data-player='" + iteration + "']").dataset.status = "betting";
            } else {
                document.querySelector("[data-player='" + iteration + "']").innerHTML = plyr + "Player " + (iteration + 1) + ": checks.";
                document.querySelector("[data-player='" + iteration + "']").dataset.status = "checking";
            }
            if (iteration == lastIteration) {
                if (document.querySelector("[data-status='betting']") !== null) {
                    [].forEach.call(document.querySelectorAll("[data-status='checking']"), function (e) {
                        let whichPlayer = Number(e.getAttribute("data-player"));
                        removeActivePlyr(whichPlayer);
                        e.innerHTML = plyr + " Player " + (whichPlayer + 1) + ": folded.";
                        e.dataset.status = "folded";
                    });
                    document.querySelector("[data-round='max']").classList.remove("hide");
                    document.querySelector("[data-round='match']").classList.remove("hide");
                    document.querySelector("[data-round='raise']").classList.remove("hide");
                    document.querySelector("[data-round='check']").classList.add("hide");
                } else {
                    document.querySelector("[data-round='max']").classList.add("hide");
                    document.querySelector("[data-round='match']").classList.add("hide");
                    document.getElementById("foldBt").classList.add("hide");
                    document.querySelector("[data-round='raise']").classList.add("hide");
                    document.querySelector("[data-round='check']").classList.remove("hide");
                }
                document.querySelector("[data-round='max']").disabled = false;
                document.querySelector("[data-round='match']").disabled = false;
                document.querySelector("[data-round='check']").disabled = false;
                stepPlayed = true;
                return false;
            }
        }
        if (resultList[iteration] >= 3 && iteration !== 0) {
            dblBets = true;
        }
        if (gameStep === 2 || gameStep === 3) {
            if (gameStep === 2 && iteration !== 0) {
                if (connectedThree === true || highCardCount > 1 || firstRoundSuited === true || resultList[iteration] >= 1) {
                    document.querySelector("[data-player='" + iteration + "']").innerHTML = plyr + " Player " + (iteration + 1) + ": bets $" + monetaryVal[gameStep + 1];
                    document.querySelector("[data-player='" + iteration + "']").dataset.status = "betting";
                } else {
                    document.querySelector("[data-player='" + iteration + "']").innerHTML = plyr + " Player " + (iteration + 1) + ": checks.";
                    document.querySelector("[data-player='" + iteration + "']").dataset.status = "checking";
                }
            }
            if (gameStep === 3 && iteration !== 0) {
                if (connectedThree === true || connectedFour > 1 || threeSuited === true || fourSuited === true || resultList[iteration] >= 1) {
                    document.querySelector("[data-player='" + iteration + "']").innerHTML = plyr + "Player " + (iteration + 1) + ": bets $" + monetaryVal[gameStep + 1];
                    document.querySelector("[data-player='" + iteration + "']").dataset.status = "betting";
                } else {
                    document.querySelector("[data-player='" + iteration + "']").innerHTML = plyr + "Player " + (iteration + 1) + ": checks.";
                    document.querySelector("[data-player='" + iteration + "']").dataset.status = "checking";
                }
                /*START FOLD BASED ON MAX BET*/
                if (maxBetHit === true && iteration !== 0) {
                    if (connectedThree === false && resultList[iteration] <= 2 && fourSuited === false) {
                        document.querySelector("[data-player='" + iteration + "']").innerHTML = plyr + " Player " + (iteration + 1) + ": checks.";
                        document.querySelector("[data-player='" + iteration + "']").dataset.status = "checking";
                    }
                }
            }/*broke up conditionals to help the javascript process*/
            if (iteration === lastIteration && iteration !== 0) {
                if (document.querySelector("[data-status='betting']") !== null) {
                    [].forEach.call(document.querySelectorAll("[data-status='checking']"), function (e) {
                        let whichPlayer = e.getAttribute("data-player");
                        removeActivePlyr(whichPlayer);
                        e.innerHTML = "Player " + (Number(whichPlayer) + 1) + ": folded.";
                        e.dataset.status = "folded";
                    });
                    [].forEach.call(document.querySelectorAll("[data-status='betting']"), function (e) {
                        let whichPlayer = e.getAttribute("data-player");
                        e.innerHTML = plyr + "Player " + (Number(whichPlayer) + 1) + ": bets $" + monetaryVal[gameStep + 1];
                    });
                    document.getElementById("foldBt").classList.remove("hide");
                    document.querySelector("[data-round='max']").classList.remove("hide");
                    document.querySelector("[data-round='match']").classList.remove("hide");
                    document.querySelector("[data-round='raise']").classList.remove("hide");
                    document.querySelector("[data-round='check']").classList.add("hide");
                } else {
                    document.querySelector("[data-round='max']").classList.add("hide");
                    document.querySelector("[data-round='match']").classList.add("hide");
                    document.querySelector("[data-round='raise']").classList.add("hide");
                    document.getElementById("foldBt").classList.add("hide");
                    document.querySelector("[data-round='check']").classList.remove("hide");
                }
                document.querySelector("[data-round='max']").disabled = false;
                document.querySelector("[data-round='match']").disabled = false;
                document.querySelector("[data-round='check']").disabled = false;
                stepPlayed = true;
                return false;
            }
        }
        if (gameStep === 4 && iteration === lastIteration) {
            document.getElementById("foldBt").disabled = true;
            messageElement.classList.remove("hide");
            if (topHand === 0) {
                youWin("default");
            } else {
                youLose(topHand);
            }
            showPlayersCards();
            document.getElementById("foldBt").classList.add("hide");
            document.querySelector("[data-round='max']").classList.add("hide");
            document.querySelector("[data-round='match']").classList.add("hide");
            document.querySelector("[data-round='raise']").classList.add("hide");
            document.querySelector("[data-round='check']").classList.add("hide");
            document.querySelector("button[title='Deal']").disabled = false;
            document.querySelector("button[title='Deal']").classList.remove("hide");
            document.querySelector("[data-round='max']").disabled = false;
            document.querySelector("[data-round='match']").disabled = false;
            document.querySelector("[data-round='check']").disabled = false;
            stepPlayed = true;
            return false;
        }
    }
}

function calculateHandStrength(hand) {
    // Mapping cards for evaluation
    const values = hand.map(card => cardHeirarchy.indexOf(card.value));
    const suits = hand.map(card => card.suit);

    const valueCounts = {};
    values.forEach(value => {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
    });

    // Same cards max
    const counts = Object.values(valueCounts);
    const maxCount = Math.max(...counts);

    // Straight verify
    const isStraight = values
        .sort((a, b) => a - b)
        .every((val, index, arr) => index === 0 || val === arr[index - 1] + 1);

    // Flush verify
    const isFlush = suits.every(suit => suit === suits[0]);

    if (isStraight && isFlush) return 8; 
    if (maxCount === 4) return 7; 
    if (maxCount === 3 && counts.includes(2)) return 6; 
    if (isFlush) return 5; 
    if (isStraight) return 4; 
    if (maxCount === 3) return 3; 
    if (counts.filter(count => count === 2).length === 2) return 2; 
    if (maxCount === 2) return 1; 
    return 0; 
}

function endGame() {
    // Disable buttons
    document.querySelector("[data-round='max']").disabled = true;
    document.querySelector("[data-round='raise']").disabled = true;
    document.querySelector("[data-round='match']").disabled = true;
    document.querySelector("[data-round='check']").disabled = true;
    document.getElementById("foldBt").disabled = true;
}

function deal() {
    resetPlayerMoney();
    hasRaised = false;

    for (let i = 0; i < playerIds.length; i++) {
        const playerElement = document.getElementById(playerIds[i]);
        if (playerElement) { 
            playerElement.innerHTML = "";
        }
    }

    communityCardsHTML = "";

    let baseBet = 50; // min start bet
    let betIncrement = playedTimes * 10; 
    maxBet = [
        baseBet + betIncrement, 
        baseBet * 2 + betIncrement, 
        baseBet * 3 + betIncrement
    ];

    // Dynamic bets 
    bet1 = Math.floor(Math.random() * (maxBet[0] - 10 + 1) + 10);
    bet2 = Math.floor(Math.random() * (maxBet[1] - maxBet[0] + 1) + maxBet[0]);
    bet3 = Math.floor(Math.random() * (maxBet[2] - maxBet[1] + 1) + maxBet[1]);

    monetaryVal = [null, 10, bet1, bet2, bet3];
    updatedBets = false;
    maxBetHit = false;
    dblBets = false;
    plyr1Pair = [];
    plyr2Pair = [];
    plyr3Pair = [];
    plyr4Pair = [];
    usedCardsArr = [];
    playedTimes += 1;
    gameIncrement = 1;
    communityCards = [];
    resultList = [0, 0, 0, 0];
    compareCards = [0, 0, 0, 0];
    activePlayers = [0, 1, 2, 3];
    playerHighCards = [0, 0, 0, 0];
    playerStraightHighCard = [0, 0, 0, 0];
    bestHoleCards = [];
    topHand = null;
    document.getElementById("communityCards").innerHTML = "";
    document.getElementById("communityCardDetails").classList.add("hide");

    [].forEach.call(document.querySelectorAll(".alert[data-player]"), function (e) {
        if (e) { 
            e.classList.remove("alert-danger");
            e.classList.add("alert-info");
            e.classList.remove("hide");
            e.classList.remove("alert-success");
            e.dataset.status = "ready";
        }
    });

    const statusElement = document.getElementById("status");
    if (statusElement) {
        statusElement.classList.add("hide");
    }

    const notificationElement = document.getElementById("notification");
    if (notificationElement) {
        notificationElement.classList.remove("alert-success");
        notificationElement.classList.remove("alert-danger");
        notificationElement.classList.add("alert-info");
    }

    const messageElement = document.getElementById("message");
    if (messageElement) {
        messageElement.innerHTML = "";
    }

    thePot = 40;
    bet = monetaryVal[1];
    playerMoney -= bet;
    setPlayerMoney("betting");

    // Update pot and bets
    document.getElementById("communityCardDetails").innerHTML = "The Pot $" + thePot;

    const betTargetElement = document.getElementById("betTarget");
    if (betTargetElement) {
        betTargetElement.innerHTML = "Bet $" + monetaryVal[1];
    }

    const playerMoneyElement = document.querySelector("#playerMoney");
    if (playerMoneyElement) {
        playerMoneyElement.innerHTML = playerMoney;
    }

    clear("deal");
    countingIterations = 0;

    const foldButton = document.getElementById("foldBt");
    if (foldButton) {
        foldButton.classList.remove("hide");
        foldButton.disabled = false;
    }

    document.querySelector("[data-round='max']").classList.remove("hide");
    document.querySelector("[data-round='max']").disabled = false;

    document.querySelector("[data-round='raise']").classList.remove("hide");
    document.querySelector("[data-round='raise']").disabled = false;

    document.querySelector("[data-round='check']").classList.remove("hide");
    document.querySelector("[data-round='check']").disabled = false;

    document.querySelector("button[title='Deal']").disabled = true;
    document.querySelector("button[title='Deal']").classList.add("hide");
    
    cards = JSON.parse(localStorage.getItem("completeCards"));

    function generatePlayer(iteration) {
        cardsInvolved = "";
        let playersCards = [];
        let playerCardsHTML = "";
        while (playersCards.length < 2) {
            let genNumber = generate(activeCards);
            if (usedCardsArr.indexOf(activeCards[genNumber].title) === -1) {
                if (iteration === 0) {
                    playerCardsHTML += `<div class='card ${activeCards[genNumber].title}' ></div>`;
                } else {
                    playerCardsHTML += `<div class='card hiddenDealerCard desktopOnly' ></div>`;
                }
                playersCards.push(cards[genNumber].title);
                usedCardsArr.push(cards[genNumber].title);
            }
        }
        let handObj = [];
        for (let i = 0; i < playersCards.length; i++) {
            handObj.push({
                suit: playersCards[i].substring(playersCards[i].indexOf("-") + 1, playersCards[i].length),
                value: playersCards[i].substring(0, playersCards[i].indexOf("-"))
            });
        }
        const playerElement = document.getElementById(playerIds[iteration]);
        if (playerElement) { 
            playerElement.innerHTML = playerCardsHTML;
        }
        playersHands[iteration] = handObj;
        evaluateHand(iteration, 1);
        return false;
    }

    let playerScores = [];
    for (let i = 0; i < 4; i++) {
        generatePlayer(i);
        let playerScore = calculateHandStrength(playersHands[i]);
        playerScores.push(playerScore);
    }

     // CFR algorithm
    // Prepare the current state
    const currentState = {
        playerHand: playersHands[0], // Principal player hand
        pot: thePot, // Pot size
        currentBet: bet, // Initial bet
        activePlayers: activePlayers.length, // Active players
        cardsDealt: communityCards.length + playersHands[0].length // Number of cards dealt
    };

    // Expose currentState and getCurrentState globally
    window.currentState = currentState;
    window.getCurrentState = function() {
        return window.currentState;
    };

    // Train the CFR algorithm
    for (let i = 0; i < 10000; i++) {
        playRound();
    }

    // Get the current strategy
    let strategy = getStrategy();

    // Possible actions
    const possibleActions = ['check', 'match', 'raise', 'allin'];

    // Calculate estimated rewards and probabilities
    const actionData = possibleActions.map(action => {
        const reward = calculateReward(currentState, action);
        const probability = strategy[action] || 0;
        return { action, reward, probability };
    });

    // Sort actions based on estimated rewards (descending)
    actionData.sort((a, b) => b.reward - a.reward);

    // Retrieve the global min and max rewards
    const minRewards = getMinRewards();
    const maxRewards = getMaxRewards();

    // Calculate overall reward range across all actions
    const allRewards = Object.values(minRewards).concat(Object.values(maxRewards));
    const globalMinReward = Math.min(...allRewards);
    const globalMaxReward = Math.max(...allRewards);

    // Prepare recommendations HTML
    let recommendationsHTML = `<strong>Estimated Reward Range:</strong> ${globalMinReward.toFixed(2)} to ${globalMaxReward.toFixed(2)}<br><br>`;
    recommendationsHTML += "<strong>Action Recommendations:</strong><br>";

    actionData.forEach((actionObj, index) => {
        recommendationsHTML += `${index + 1}. ${actionObj.action.toUpperCase()} - Estimated Reward: ${actionObj.reward.toFixed(2)}<br>`;
    });

    // Display the recommendations in the 'top-moves' element
    const topMovesElement = document.getElementById("top-moves");
    if (topMovesElement) {
        topMovesElement.innerHTML = recommendationsHTML;
    } else {
        console.error("Element with ID 'top-moves' not found.");
    }

    // Hand strength simulation
    let maxPlayerBet = 10; 

    for (let i = 1; i <= 3; i++) { // players 2,3,4
        const score = playerScores[i];
        const betDecision = Math.random(); // random factor
        let playerBet = 10; 

        if (score >= 8 || betDecision > 0.8) { // Agressive
            playerBet = bet2; 
            const playerElement = document.querySelector(`[data-player='${i}']`);
            if (playerElement) {
                playerElement.dataset.status = "betting";
                playerElement.dataset.lastMove = "bet";
                playerElement.innerHTML = `Player ${i + 1} bets $${playerBet}`;
            }
        } else if (score >= 4 || betDecision > 0.5) { // Medium 
            playerBet = 10; 
            const playerElement = document.querySelector(`[data-player='${i}']`);
            if (playerElement) {
                playerElement.dataset.status = "checking";
                playerElement.dataset.lastMove = "check";
                playerElement.innerHTML = `Player ${i + 1} checks`;
            }
        } else { // Weak
            playerBet = 0; // No bet
            const playerElement = document.querySelector(`[data-player='${i}']`);
            if (playerElement) {
                playerElement.dataset.status = "folded";
                playerElement.dataset.lastMove = "fold";
                playerElement.innerHTML = `Player ${i + 1} folds`;
            }
            removeActivePlyr(i);
        }

        // Update the bet if there is upbet
        if (playerBet > maxPlayerBet) {
            maxPlayerBet = playerBet;
        }
    }

    // Buttons configuration
    document.querySelector("[data-round='match']").innerHTML = `Min Bet $${maxPlayerBet}`;
    document.querySelector("[data-round='raise']").innerHTML = `Raise to $${Math.ceil(maxPlayerBet * 1.25)}`; // Raise al 25% sobre la apuesta máxima
    document.querySelector("[data-round='max']").innerHTML = `All In $${playerMoney}`; // All-in con todo el dinero disponible

    // Start winner evaluation
    if (activePlayers.length === 1) { 
        endGame();
        return false;
    }

    // Disable check
    let shouldDisableCheck = activePlayers.some(player => player !== 0 && document.querySelector(`[data-player='${player}']`).dataset.status === 'betting');
    hasRaised = shouldDisableCheck; 
    document.querySelector("[data-round='check']").disabled = hasRaised;

    return false;
}

function match(checked, betMultiplier) {
    console.log(`Action received - Checked: ${checked}, Bet Multiplier: ${betMultiplier}`);

    gameIncrement++;
    let gameStep = gameIncrement;
    let maxLength = gameStep < 4 ? gameStep + 1 : 5;

    document.getElementById("communityCardDetails").classList.remove("hide");

    // Verify upbet in the last round
    let anyPlayerRaised = activePlayers.some(player => {
        return player !== 0 && document.querySelector(`[data-player='${player}']`).dataset.lastMove === "bet";
    });

    console.log(`Iteración ${gameStep}: anyPlayerRaised = ${anyPlayerRaised}`);

    // Folder players after betting
    if (anyPlayerRaised) {
        activePlayers.forEach(player => {
            if (player !== 0) {
                let playerElement = document.querySelector(`[data-player='${player}']`);
                if (playerElement && playerElement.dataset.lastMove === "check") {
                    playerElement.dataset.status = "folded";
                    playerElement.innerHTML = `Player ${player + 1} is folded by check`;
                    removeActivePlyr(player);
                    console.log(`Player ${player + 1} hizo check y fue folded`);
                }
            }
        });
    }

    // CFR Recommendations
    // Prepare the current state
    const currentState = {
        playerHand: playersHands[0], // Principal player hand
        pot: thePot, // Pot size
        currentBet: bet, // Initial bet
        activePlayers: activePlayers.length, // Active players
        cardsDealt: communityCards.length + playersHands[0].length // Number of cards dealt
    };

    // Expose currentState and getCurrentState globally
    window.currentState = currentState;
    window.getCurrentState = function() {
        return window.currentState;
    };

    // Train the CFR algorithm
    for (let i = 0; i < 10000; i++) {
        playRound();
    }

    // Get the current strategy
    let strategy = getStrategy();

    // Possible actions
    const possibleActions = ['check', 'match', 'raise', 'allin'];

    // Calculate estimated rewards and probabilities
    const actionData = possibleActions.map(action => {
        const reward = calculateReward(currentState, action);
        const probability = strategy[action] || 0;
        return { action, reward, probability };
    });

    // Sort actions based on estimated rewards (descending)
    actionData.sort((a, b) => b.reward - a.reward);

    // Retrieve the global min and max rewards
    const minRewards = getMinRewards();
    const maxRewards = getMaxRewards();

    // Calculate overall reward range across all actions
    const allRewards = Object.values(minRewards).concat(Object.values(maxRewards));
    const globalMinReward = Math.min(...allRewards);
    const globalMaxReward = Math.max(...allRewards);

    // Prepare recommendations HTML
    let recommendationsHTML = `<strong>Estimated Reward Range:</strong> ${globalMinReward.toFixed(2)} to ${globalMaxReward.toFixed(2)}<br><br>`;
    recommendationsHTML += "<strong>Action Recommendations:</strong><br>";

    actionData.forEach((actionObj, index) => {
        recommendationsHTML += `${index + 1}. ${actionObj.action.toUpperCase()} - Estimated Reward: ${actionObj.reward.toFixed(2)}<br>`;
    });

    // Display the recommendations in the 'top-moves' element
    const topMovesElement = document.getElementById("top-moves");
    if (topMovesElement) {
        topMovesElement.innerHTML = recommendationsHTML;
    } else {
        console.error("Element with ID 'top-moves' not found.");
    }

     let player1Bet = 0;
     let maxPlayerBet = 10; // Minimun bet

     if (!checked) { 
         if (gameStep === 2) { 
             // Validate step
             if (betMultiplier === 1) {
                 player1Bet = parseFloat(document.querySelector("[data-round='match']").innerHTML.split('$')[1]); 
             } else if (betMultiplier === 2) {
                 player1Bet = parseFloat(document.querySelector("[data-round='raise']").innerHTML.split('$')[1]); 
             } else if (betMultiplier === 3) {
                 player1Bet = parseFloat(document.querySelector("[data-round='max']").innerHTML.split('$')[1]); 
             }
         } else {
             // Standar logic
             if (betMultiplier === 1) {
                 player1Bet = maxPlayerBet; // Minimun bet match
             } else if (betMultiplier === 2) {
                 player1Bet = Math.ceil(maxPlayerBet * 1.25); // Raise bet
             } else if (betMultiplier === 3) {
                 player1Bet = playerMoney; // All in
             }
         }
     } else {
         player1Bet = 0; // Check
     }
 
     console.log(`Player principal action: Checked: ${checked}, Bet Multiplier: ${betMultiplier}, Player bet: ${player1Bet}`);
 
 
     // Update player bet and pot
     bet += player1Bet;
     playerMoney -= player1Bet;
     thePot += player1Bet;
     setPlayerMoney("betting");
 
     console.log(`Updated values - Bet: ${bet}, Player Money: ${playerMoney}, Pot: ${thePot}`);
 
     document.getElementById("betTarget").innerHTML = "Bet $" + bet;
     document.getElementById("communityCardDetails").innerHTML = "The Pot $" + thePot;
 
     document.getElementById("playerMoney").innerHTML = playerMoney;

    // Show cards
    if (gameStep === 2) {
        communityCards = [];
        document.getElementById("communityCardDetails").classList.remove("hide");
        buildCommunityCards(3, gameStep);
    } else {
        buildCommunityCards(maxLength, gameStep);
    }

    // Evaluate players hand in each iteration
    let evaled = [];
    for (let i = 0; i < activePlayers.length; i++) {
        if (!evaled.includes(activePlayers[i]) && activePlayers[i] !== undefined) {
            evaluateHand(activePlayers[i], gameStep);
            evaled.push(activePlayers[i]);
        }
    }

    // Players logic bets
    for (let i = 1; i <= 3; i++) { // Players 2,3,4
        if (!activePlayers.includes(i)) continue; // Jump if a player is folded

        if (gameStep >= 4) { 
            document.querySelector(`[data-player='${i}']`).dataset.status = "finished";
            continue;
        }

        const playerHandStrength = calculateHandStrength(playersHands[i]);
        const playerDecisionFactor = Math.random();
        let playerBet = 10; 

        if (playerHandStrength >= 8 || (playerHandStrength >= 5 && playerDecisionFactor > 0.7)) {
            playerBet = Math.max(maxPlayerBet, 10); 
            document.querySelector(`[data-player='${i}']`).dataset.status = "betting";
            document.querySelector(`[data-player='${i}']`).innerHTML = `Player ${i + 1} bets $${playerBet}`;
            document.querySelector(`[data-player='${i}']`).dataset.lastMove = "bet"; 
            thePot += playerBet; 
            console.log(`Player ${i + 1} bets: ${playerBet}, Total Pot: ${thePot}`);
        } else if (playerHandStrength >= 4 || (playerHandStrength >= 2 && playerDecisionFactor > 0.4)) {
            document.querySelector(`[data-player='${i}']`).dataset.status = "checking";
            document.querySelector(`[data-player='${i}']`).innerHTML = `Player ${i + 1} checks`;
            document.querySelector(`[data-player='${i}']`).dataset.lastMove = "check"; 
            console.log(`Player ${i + 1} checks`);
        } else {
            document.querySelector(`[data-player='${i}']`).dataset.status = "folded";
            document.querySelector(`[data-player='${i}']`).innerHTML = `Player ${i + 1} folds`;
            document.querySelector(`[data-player='${i}']`).dataset.lastMove = "fold"; 
            removeActivePlyr(i);
            console.log(`Player ${i + 1} folds`);
        }

        if (playerBet > maxPlayerBet) {
            maxPlayerBet = playerBet;
        }
    }

    document.querySelector("[data-round='match']").innerHTML = `Min Bet $${maxPlayerBet}`;
    document.querySelector("[data-round='raise']").innerHTML = `Raise to $${Math.ceil(maxPlayerBet * 1.25)}`; 
    document.querySelector("[data-round='max']").innerHTML = `All In $${playerMoney}`; 

    let shouldDisableCheck = activePlayers.some(player => player !== 0 && document.querySelector(`[data-player='${player}']`).dataset.status === 'betting');
    hasRaised = shouldDisableCheck; 
    document.querySelector("[data-round='check']").disabled = hasRaised;

    // Evaluate if there is only one player
    if (gameStep >= 4 || activePlayers.length === 1) {
        endGame();
    }
}









