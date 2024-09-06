// Inicializar diccionario de regrets para cada acción
let regretSum = {
    'check': 0,
    'match': 0,
    'raise': 0,
    'allin': 0
};

// Inicializar diccionario de estrategias
let strategySum = {
    'check': 0,
    'match': 0,
    'raise': 0,
    'allin': 0
};

// Función para obtener la estrategia basada en regrets
function getStrategy() {
    let normalizingSum = 0;
    let strategy = {};

    // Calcular la estrategia de acuerdo al regret
    Object.keys(regretSum).forEach(action => {
        strategy[action] = Math.max(regretSum[action], 0);
        normalizingSum += strategy[action];
    });

    // Normalizar la estrategia
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

// Función para actualizar regrets basados en el resultado de la ronda
function updateRegrets(action, reward, counterfactualRewards) {
    // Calcular regrets contrafactuales
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

    // Mostrar la recomendación en la interfaz del jugador
    document.getElementById("recommendation").innerHTML = `Recomendación: ${recommendedAction.toUpperCase()} 
    (${(strategy[recommendedAction] * 100).toFixed(2)}%)`;
}

// Ejemplo de cómo utilizar estas funciones durante una ronda del juego
function playRound() {
    let currentState = getCurrentState(); // Define una función para obtener el estado actual del juego
    let strategy = getStrategy();

    // Simular una decisión del jugador basada en la estrategia actual
    let action = selectAction(strategy);

    // Calcular recompensas contrafactuales para todas las acciones posibles
    let counterfactualRewards = calculateCounterfactualRewards(currentState, strategy);

    // Asumir que reward es la recompensa para la acción tomada
    let reward = counterfactualRewards[action];

    // Actualizar regrets basados en el resultado
    updateRegrets(action, reward, counterfactualRewards);

    // Recomendar una acción basada en los regrets acumulados
    recommendAction();
}

// Función para seleccionar una acción basada en la estrategia
function selectAction(strategy) {
    let randomValue = Math.random();
    let cumulativeProbability = 0.0;
    for (let action in strategy) {
        cumulativeProbability += strategy[action];
        if (randomValue < cumulativeProbability) {
            return action;
        }
    }
    return 'check'; // Acción por defecto
}

function calculateReward(currentState, action) {
    const handStrength = calculateHandStrength(currentState.playerHand); // Fuerza de la mano del jugador
    const potSize = currentState.pot; // Tamaño del pot actual
    const playerBet = currentState.currentBet; // Apuesta actual del jugador
    const remainingPlayers = currentState.activePlayers; // Jugadores restantes en la ronda

    // Calcula una estimación de la recompensa para la acción específica
    let estimatedReward = 0;

    // Definir recompensa basada en la acción seleccionada
    switch (action) {
        case 'check':
            // Check: No cambia la apuesta, recompensa basada en la fuerza de la mano y si otros jugadores pueden apostar
            estimatedReward = handStrength - 0.5; // Penalización leve por no apostar
            break;

        case 'match':
            // Match: Recompensa basada en la fuerza de la mano comparada con la apuesta actual
            if (handStrength > 5) { 
                // Si la mano es fuerte, es más probable que "match" sea una buena opción
                estimatedReward = (potSize - playerBet) * (handStrength / 10);
            } else {
                // Si la mano es débil, es menos probable que "match" sea una buena opción
                estimatedReward = -(playerBet / 2);
            }
            break;

        case 'raise':
            // Raise: Recompensa más alta por intentar aumentar el pot
            if (handStrength > 7) {
                // Si la mano es muy fuerte, aumentar la apuesta puede ser beneficioso
                estimatedReward = potSize * (handStrength / 8);
            } else {
                // Penalización si la mano no es suficientemente fuerte para justificar un "raise"
                estimatedReward = -(playerBet);
            }
            break;

        case 'allin':
            // All in: Recompensa muy alta si la mano es extremadamente fuerte, de lo contrario, penalización
            if (handStrength > 8) {
                // All-in con una mano muy fuerte
                estimatedReward = potSize * (handStrength / 5);
            } else {
                // Gran penalización si se va "all-in" con una mano débil
                estimatedReward = -(playerBet * 2);
            }
            break;

        default:
            estimatedReward = 0; // Acción desconocida
            break;
    }

    // Ajusta la recompensa para tener en cuenta el número de jugadores restantes
    if (remainingPlayers > 2) {
        estimatedReward *= (3 / remainingPlayers); // Ajustar recompensa si hay muchos jugadores
    }

    // Considerar factores adicionales como probabilidades estadísticas de mejorar la mano
    const improvementFactor = getImprovementFactor(currentState);
    estimatedReward *= improvementFactor;

    return estimatedReward;
}

// Función auxiliar para calcular el factor de mejora
function getImprovementFactor(currentState) {
    // Calcular la probabilidad de mejorar la mano en función del número de cartas por salir, etc.
    // Esto podría basarse en tablas de probabilidades de póker o simulaciones.
    // Por simplicidad, usamos un valor aleatorio entre 0.8 y 1.2 para simular esto.
    return Math.random() * (1.2 - 0.8) + 0.8;
}

