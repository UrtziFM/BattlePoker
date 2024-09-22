// CFRPlayer.js

// Initialize a dictionary of regrets for each action
let regretSum = {
    'check': 0,
    'match': 0,
    'raise': 0,
    'allin': 0
};

// Initialize a dictionary of strategies
let strategySum = {
    'check': 0,
    'match': 0,
    'raise': 0,
    'allin': 0
};

// New reward range trackers
let minRewards = {
    'check': Infinity,
    'match': Infinity,
    'raise': Infinity,
    'allin': Infinity
};

let maxRewards = {
    'check': -Infinity,
    'match': -Infinity,
    'raise': -Infinity,
    'allin': -Infinity
};

// Function to obtain the strategy based on regrets
function getStrategy() {
    let normalizingSum = 0;
    let strategy = {};

    // Calculate the strategy according to the regret
    Object.keys(regretSum).forEach(action => {
        strategy[action] = Math.max(regretSum[action], 0);
        normalizingSum += strategy[action];
    });

    // Normalize the strategy
    Object.keys(strategy).forEach(action => {
        if (normalizingSum > 0) {
            strategy[action] /= normalizingSum;
        } else {
            strategy[action] = 1.0 / Object.keys(strategy).length;
        }
        strategySum[action] += strategy[action];
    });

    return strategy;
}

// Function to update regrets based on the result of the round
function updateRegrets(action, reward, counterfactualRewards) {
    // Calculate counterfactual regrets
    Object.keys(regretSum).forEach(a => {
        let regret = counterfactualRewards[a] - reward;
        regretSum[a] += regret;
    });
}

function calculateCounterfactualRewards(currentState, strategy) {
    let rewards = {
        'check': calculateReward(currentState, 'check'),
        'match': calculateReward(currentState, 'match'),
        'raise': calculateReward(currentState, 'raise'),
        'allin': calculateReward(currentState, 'allin')
    };

    return rewards;
}

function recommendAction() {
    let strategy = getStrategy();
    let recommendedAction = Object.keys(strategy).reduce((a, b) => strategy[a] > strategy[b] ? a : b);

    // Display the recommendation on the player's interface
    document.getElementById("top-moves").innerHTML = `Recommendation: ${recommendedAction.toUpperCase()} 
    (${(strategy[recommendedAction] * 100).toFixed(2)}%)`;
}

// Example of how to use these functions during a round of the game
function playRound() {
    let currentState = getCurrentState(); // Define a function to get the current state of the game
    let strategy = getStrategy();

    // Simulate a decision of the player based on the current strategy
    let action = selectAction(strategy);

    // Calculate counterfactual rewards for all possible actions
    let counterfactualRewards = calculateCounterfactualRewards(currentState, strategy);

    // Assume that reward is the reward for the action taken
    let reward = counterfactualRewards[action];

    // Update regrets based on the result
    updateRegrets(action, reward, counterfactualRewards);

    // Recommend an action based on the accumulated regrets
    recommendAction();
}

// Function to select an action based on the strategy
function selectAction(strategy) {
    let randomValue = Math.random();
    let cumulativeProbability = 0.0;
    for (let action in strategy) {
        cumulativeProbability += strategy[action];
        if (randomValue < cumulativeProbability) {
            return action;
        }
    }
    return 'check'; // Default action
}

function calculateReward(currentState, action) {
    const handStrength = calculateHandStrength(currentState.playerHand, currentState.communityCards || []);
    const potSize = currentState.pot;
    const playerBet = currentState.currentBet;
    const remainingPlayers = currentState.activePlayers;

    let estimatedReward = 0;

    // Define reward based on the selected action
    switch (action) {
        case 'check':
            estimatedReward = handStrength - 0.5; // Slight penalty for not betting
            break;

        case 'match':
            if (handStrength > 5) { 
                estimatedReward = (potSize - playerBet) * (handStrength / 10);
            } else {
                estimatedReward = -(playerBet / 2);
            }
            break;

        case 'raise':
            if (handStrength > 7) {
                estimatedReward = potSize * (handStrength / 8);
            } else {
                estimatedReward = -(playerBet);
            }
            break;

        case 'allin':
            if (handStrength > 8) {
                estimatedReward = potSize * (handStrength / 5);
            } else {
                estimatedReward = -(playerBet * 2);
            }
            break;

        default:
            estimatedReward = 0; // Unknown action
            break;
    }

    // Adjust the reward based on the number of remaining players
    if (remainingPlayers > 2) {
        estimatedReward *= (3 / remainingPlayers);
    }

    // Consider additional factors such as statistical probabilities of improving the hand
    const improvementFactor = getImprovementFactor(currentState);
    estimatedReward *= improvementFactor;

    // Update min and max rewards
    if (estimatedReward < minRewards[action]) {
        minRewards[action] = estimatedReward;
    }
    if (estimatedReward > maxRewards[action]) {
        maxRewards[action] = estimatedReward;
    }

    return estimatedReward;
}

// Auxiliary function to calculate the improvement factor
function getImprovementFactor(currentState) {
    // Calculate the probability of improving the hand based on the number of cards to come, etc.
    // This could be based on poker probability tables or simulations.
    // For simplicity, we use a random value between 0.8 and 1.2 to simulate this.
    return Math.random() * (1.2 - 0.8) + 0.8;
}

// At the end of CFR.js

// Expose reward ranges globally
window.getMinRewards = function() {
    return minRewards;
};

window.getMaxRewards = function() {
    return maxRewards;
};

// Expose other necessary functions globally
window.calculateHandStrength = calculateHandStrength;
window.getImprovementFactor = getImprovementFactor;
window.getStrategy = getStrategy;
window.playRound = playRound;
window.calculateReward = calculateReward;
window.recommendAction = recommendAction;
window.selectAction = selectAction;

