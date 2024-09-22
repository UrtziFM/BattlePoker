// CFR.js

class CFRPlayer {
    constructor() {
        // Initialize cumulative regrets and strategy sums for each action
        this.actions = ['check', 'call', 'raise', 'allin', 'fold'];
        this.regretSum = {};
        this.strategySum = {};
        this.numActions = this.actions.length;

        this.actions.forEach(action => {
            this.regretSum[action] = 0;
            this.strategySum[action] = 0;
        });
    }

    /**
     * Calculates the current strategy based on cumulative regrets.
     * Returns an object mapping actions to probabilities.
     */
    getStrategy() {
        let normalizingSum = 0;
        let strategy = {};

        // Calculate positive regrets
        this.actions.forEach(action => {
            strategy[action] = Math.max(this.regretSum[action], 0);
            normalizingSum += strategy[action];
        });

        // Normalize the strategy
        this.actions.forEach(action => {
            if (normalizingSum > 0) {
                strategy[action] /= normalizingSum;
            } else {
                // If all regrets are zero, select uniformly at random
                strategy[action] = 1.0 / this.numActions;
            }
            // Accumulate the strategy over time
            this.strategySum[action] += strategy[action];
        });

        return strategy;
    }

    /**
     * Calculates the average strategy over all iterations.
     * Returns an object mapping actions to probabilities.
     */
    getAverageStrategy() {
        let averageStrategy = {};
        let normalizingSum = 0;

        this.actions.forEach(action => {
            normalizingSum += this.strategySum[action];
        });

        this.actions.forEach(action => {
            if (normalizingSum > 0) {
                averageStrategy[action] = this.strategySum[action] / normalizingSum;
            } else {
                averageStrategy[action] = 1.0 / this.numActions;
            }
        });

        return averageStrategy;
    }

    /**
     * Selects an action based on the current strategy probabilities.
     * Returns the selected action as a string.
     */
    selectAction(strategy) {
        let r = Math.random();
        let cumulativeProbability = 0.0;
        for (let i = 0; i < this.actions.length; i++) {
            let action = this.actions[i];
            cumulativeProbability += strategy[action];
            if (r < cumulativeProbability) {
                return action;
            }
        }
        return this.actions[this.actions.length - 1]; // Return last action as default
    }

    /**
     * Updates cumulative regrets based on the difference between
     * counterfactual rewards and the reward of the action taken.
     */
    updateRegrets(actionTaken, reward, counterfactualRewards) {
        this.actions.forEach(action => {
            let regret = counterfactualRewards[action] - reward;
            this.regretSum[action] += regret;
        });
    }

    /**
     * Calculates counterfactual rewards for all possible actions.
     * Returns an object mapping actions to estimated rewards.
     */
    calculateCounterfactualRewards(currentState) {
        let rewards = {};
        this.actions.forEach(action => {
            if (this.isValidAction(currentState, action)) {
                rewards[action] = this.calculateReward(currentState, action);
            } else {
                rewards[action] = Number.NEGATIVE_INFINITY; // Invalid actions receive a very low reward
            }
        });
        return rewards;
    }

    /**
     * Estimates the reward for a given action based on the current state.
     * Returns a numerical value representing the estimated reward.
     */
    calculateReward(currentState, action) {
        const handStrength = calculateHandStrength(currentState.playerHand, currentState.communityCards);
        const potSize = currentState.potSize;
        const playerBet = currentState.playerBet;
        const remainingPlayers = currentState.remainingPlayers;

        let estimatedReward = 0;

        // Adjust reward based on action and hand strength
        switch (action) {
            case 'check':
                if (currentState.canCheck) {
                    estimatedReward = handStrength * 0.5; // Minimal reward for checking
                } else {
                    estimatedReward = Number.NEGATIVE_INFINITY; // Can't check when a bet is required
                }
                break;

            case 'call':
                if (currentState.canCall) {
                    estimatedReward = handStrength * potSize - playerBet;
                } else {
                    estimatedReward = Number.NEGATIVE_INFINITY; // Can't call if no bet to match
                }
                break;

            case 'raise':
                if (currentState.canRaise) {
                    estimatedReward = handStrength * (potSize + currentState.raiseAmount) - playerBet;
                } else {
                    estimatedReward = Number.NEGATIVE_INFINITY; // Can't raise if not allowed
                }
                break;

            case 'allin':
                if (currentState.canAllIn) {
                    estimatedReward = handStrength * (potSize + currentState.playerStack) - playerBet;
                } else {
                    estimatedReward = Number.NEGATIVE_INFINITY; // Can't go all-in if not possible
                }
                break;

            case 'fold':
                if (currentState.canFold) {
                    estimatedReward = -playerBet; // Lose current bet when folding
                } else {
                    estimatedReward = Number.NEGATIVE_INFINITY; // Can't fold if not allowed
                }
                break;

            default:
                estimatedReward = Number.NEGATIVE_INFINITY; // Unknown action
                break;
        }

        // Adjust reward based on the number of remaining players
        if (remainingPlayers > 1 && estimatedReward > Number.NEGATIVE_INFINITY) {
            estimatedReward *= (2 / remainingPlayers); // More players increase competition
        }

        // Calculate the improvement factor based on potential to improve the hand
        const improvementFactor = getImprovementFactor(currentState);
        estimatedReward *= improvementFactor;

        return estimatedReward;
    }

    /**
     * Validates if an action is permissible in the current state.
     * Returns true if the action is valid, false otherwise.
     */
    isValidAction(currentState, action) {
        switch (action) {
            case 'check':
                return currentState.canCheck;
            case 'call':
                return currentState.canCall;
            case 'raise':
                return currentState.canRaise;
            case 'allin':
                return currentState.canAllIn;
            case 'fold':
                return currentState.canFold;
            default:
                return false;
        }
    }

    /**
     * Trains the CFR algorithm over multiple iterations.
     * `iterations` specifies the number of training iterations.
     */
    train(iterations, currentState) {
        for (let i = 0; i < iterations; i++) {
            let strategy = this.getStrategy();
            let action = this.selectAction(strategy);
            let counterfactualRewards = this.calculateCounterfactualRewards(currentState);
            let reward = counterfactualRewards[action];
            this.updateRegrets(action, reward, counterfactualRewards);
        }
    }
    

    /**
     * Recommends an action based on the average strategy.
     * Updates the recommendation in the user interface.
     */
    recommendAction() {
        let averageStrategy = this.getAverageStrategy();
        let recommendedAction = this.actions.reduce((a, b) => averageStrategy[a] > averageStrategy[b] ? a : b);
    
        // Return the recommendation and strategy
        return {
            recommendedAction,
            averageStrategy
        };
    }
    
}

/**
 * Simplified hand strength evaluation.
 * Returns a numerical value between 0 and 1 representing hand strength.
 */
function calculateHandStrength(playerHand, communityCards) {
    const allCards = playerHand.concat(communityCards);
    console.log('allCards:', allCards);

    // Count the occurrences of each rank
    const rankCounts = {};
    allCards.forEach((card, index) => {
        if (!card) {
            console.error(`Undefined card at index ${index} in allCards`);
        } else if (!card.value) {
            console.error(`Card at index ${index} missing 'value' property:`, card);
        } else {
            rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
        }
    })

    // Identify pairs, three of a kind, etc.
    const counts = Object.values(rankCounts);
    const maxCount = Math.max(...counts);

    // Check for flush (all same suit)
    const suitCounts = {};
    allCards.forEach(card => {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });
    const maxSuitCount = Math.max(...Object.values(suitCounts));

    // Check for straight
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const rankIndices = allCards.map(card => rankOrder.indexOf(card.rank)).sort((a, b) => a - b);
    let isStraight = false;
    for (let i = 0; i <= rankIndices.length - 5; i++) {
        if (rankIndices[i + 4] - rankIndices[i] === 4) {
            isStraight = true;
            break;
        }
    }

    // Assign strength based on hand type
    let strength = 0;
    if (maxSuitCount >= 5 && isStraight) {
        // Straight flush
        strength = 1.0;
    } else if (maxCount === 4) {
        // Four of a kind
        strength = 0.9;
    } else if (maxCount === 3 && counts.includes(2)) {
        // Full house
        strength = 0.8;
    } else if (maxSuitCount >= 5) {
        // Flush
        strength = 0.7;
    } else if (isStraight) {
        // Straight
        strength = 0.6;
    } else if (maxCount === 3) {
        // Three of a kind
        strength = 0.5;
    } else if (counts.filter(count => count === 2).length >= 2) {
        // Two pair
        strength = 0.4;
    } else if (maxCount === 2) {
        // One pair
        strength = 0.3;
    } else {
        // High card
        strength = 0.2;
    }

    // Adjust strength based on high card
    const highCardIndex = Math.max(...rankIndices);
    strength += (highCardIndex / rankOrder.length) * 0.1;

    return strength;
}

/**
 * Calculates the probability of improving the hand.
 * Returns a numerical value representing the improvement factor.
 */
function getImprovementFactor(currentState) {
    const outs = calculateOuts(currentState.playerHand, currentState.communityCards);
    const remainingCards = 52 - currentState.cardsDealt;
    return Math.min((outs / remainingCards) * 2, 1); // Cap the factor at 1
}

/**
 * Calculates the number of outs for the player's hand.
 * Returns the number of cards that can improve the player's hand.
 */
function calculateOuts(playerHand, communityCards) {
    // Implement a function to calculate the actual number of outs
    // For simplicity, we'll use a basic example for a flush draw
    const allCards = playerHand.concat(communityCards);
    const suits = allCards.map(card => card.suit.toLowerCase());
    const suitCounts = {};
    suits.forEach(suit => {
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });

    let maxSuitCount = 0;
    for (let suit in suitCounts) {
        if (suitCounts[suit] > maxSuitCount) {
            maxSuitCount = suitCounts[suit];
        }
    }

    if (maxSuitCount === 4) {
        // One card away from a flush
        return 9; // Number of remaining cards in that suit
    } else if (maxSuitCount === 3) {
        // Two cards away from a flush
        return 10; // Approximate number of outs including possible straight draws
    }

    // Add logic for other types of draws (straight draws, etc.) as needed
    return 0; // Default to zero if no significant draws
}

/**
 * Retrieves the current state of the game.
 * Returns an object representing the game state.
 */
function getCurrentState() {
    // Replace this with actual game state data
    return {
        playerHand: [
            { rank: 'A', suit: 'spades' },
            { rank: 'K', suit: 'spades' }
        ],
        communityCards: [
            { rank: 'Q', suit: 'spades' },
            { rank: 'J', suit: 'spades' },
            { rank: '2', suit: 'hearts' }
        ],
        potSize: 100,
        playerBet: 10,
        remainingPlayers: 3,
        canCheck: true,
        canCall: false,
        canRaise: true,
        canAllIn: true,
        canFold: true,
        raiseAmount: 20,
        playerStack: 1000,
        cardsDealt: 5 // Total cards dealt (2 hole cards + 3 community cards)
    };
}

// Expose CFRPlayer and helper functions globally
window.CFRPlayer = CFRPlayer;
window.calculateHandStrength = calculateHandStrength;
window.getImprovementFactor = getImprovementFactor;
window.calculateOuts = calculateOuts;

