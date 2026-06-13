# Gut-Brain Axis: Alcohol Dependency Computational Model

A web-based computational simulation exploring the bidirectional relationship between gut microbiome composition and brain reward systems in the development of alcohol dependency.

## Overview

This model simulates the interaction between two bacterial populations—alcohol-tolerant (B0) and commensal (B1)—and a reinforcement learning (Q-learning) brain agent. The agent selects meals based on nutrient composition, which alters the gut microbiome. In turn, the microbiome produces neuroactive chemical signals that act as rewards, training the agent to prefer foods that sustain the dominant bacterial population. This creates a self-reinforcing feedback loop that models the emergence of dietary dependency and dysbiosis.

## Key Features

- **Stochastic Population Dynamics**: Simulates bacterial birth, death, carrying capacity constraints, and competitive inhibition
- **Reinforcement Learning**: Implements a Q-learning agent with epsilon-greedy exploration to model adaptive food choices
- **Real-time Visualization**: Six interactive charts tracking population sizes, Shannon diversity, chemical signals, Q-values, meal choices, and dysbiosis ratios
- **Customizable Inputs**: Adjustable growth rates, learning parameters, and dynamic meal nutrient profiles (Alcohol, Sugar, Protein, Fiber)
- **Data Export**: Expand and download individual graph plots for analysis and reporting

## How to Run

This is a client-side application requiring no build tools or backend server.

1. Download or clone the repository
2. Open the `index.html` file in any modern web browser (Chrome, Firefox, Safari, Edge)
3. Configure the simulation parameters in the left sidebar
4. Click **Start** to run the simulation and observe the real-time dynamics

## File Structure

├── index.html          # Main HTML structure and layout
├── styles.css          # CSS styling and responsive design
├── simulation.js       # Core simulation logic and mathematical models
├── app.js              # UI controls, visualization, and event handling
└── README.md           # This documentation file

## Model Components

### Microbiome Dynamics

The simulation tracks two bacterial populations:

- **B0 (Alcohol-tolerant)**: Thrives on alcohol, produces craving-inducing chemicals, inhibits B1 growth
- **B1 (Commensal)**: Thrives on sugar, protein, and fiber, represents healthy microbiome

Population updates incorporate:
- Nutrient-dependent birth rates
- Density-dependent death rates (carrying capacity constraints)
- Competitive inhibition effects
- Biological stochastic noise

### Reinforcement Learning

The brain agent uses **Q-learning** to select meals:

- **State**: [B0​,B1​,Kick,Diversity]
- **Actions**: Selection from available meal options
- **Reward**: Chemical signal strength from gut (B0 population × production rate)
- **Policy**: Epsilon-greedy exploration-exploitation strategy

## Parameters

### Microbiome Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| B0 Growth Rate | 0.25 | Birth rate coefficient for alcohol-tolerant bacteria |
| B1 Growth Rate | 0.20 | Birth rate coefficient for commensal bacteria |
| Inhibition | 0.15 | Strength of B0 suppression of B1 |
| Carrying Capacity | 1000 | Maximum sustainable total population |
| Chemical Production | 0.05 | Chemical signal per B0 bacterium |

### Reinforcement Learning Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Learning Rate (α) | 0.1 | Speed of Q-value updates |
| Discount Factor (γ) | 0.9 | Importance of future rewards |
| Exploration Rate (ε) | 0.2 | Probability of random action |
| Kick Threshold | 50 | Chemical level for reward amplification |

### Meal Configuration

Each meal has four nutrient components:
- **Alcohol**: Promotes B0 growth
- **Sugar**: Promotes B1 growth
- **Protein**: Promotes B1 growth
- **Fiber**: Promotes B1 growth

## Visualizations

The simulation provides six real-time plots:

1. **Microbiome Composition**: Population trajectories of B0 and B1 over time
2. **Microbial Diversity**: Shannon Index measuring ecosystem health
3. **Chemical Signal**: Concentration of B0 metabolites acting as reward signal
4. **Q-Values**: Learned expected rewards for each meal option
5. **Meal Choice**: Temporal sequence of food selections
6. **Dysbiosis Ratio**: B0 proportion indicating dependency state

## Dependencies

- **Chart.js** (v3.9+): Visualization library (loaded via CDN)
- No npm packages or build tools required

## Mathematical Formulation

### Population Dynamics

B0_birth = B0 × r₀ × (1 + alcohol × 4)
B1_birth = B1 × r₁ × (1 + (sugar + protein + fiber) × 2)

density_stress = (total_population / carrying_capacity)^1.5

B0_death = B0 × (r₀ × 0.4) × (1 + density_stress)
B1_death = B1 × (r₁ × 0.4) × (1 + density_stress)

inhibition_effect = α × B0 × B1 × 0.005

B0_{t+1} = max(10, B0_t + B0_birth - B0_death + noise)
B1_{t+1} = max(10, B1_t + B1_birth - B1_death - inhibition_effect + noise)

### Q-Learning Update

Q(s,a) ← Q(s,a) + α × [r + γ × max_a' Q(s',a') - Q(s,a)]

where:
- α = learning rate
- γ = discount factor
- r = reward (chemical signal)
- s = current state (B0 proportion)
- a = action (meal choice)

### Shannon Diversity Index

H = -Σ p_i × ln(p_i)

where p_i is the proportion of species i
Maximum H = ln(2) ≈ 0.693 when populations are equal

## Usage Instructions

1. **Configure Parameters**: Adjust model parameters in the left sidebar to explore different scenarios
2. **Start Simulation**: Click the "Start" button to begin the simulation
3. **Observe Dynamics**: Monitor real-time changes in the six visualization panels
4. **Analyze Results**: Use the expand and download buttons on each graph to examine specific data
5. **Experiment**: Try different parameter combinations to explore conditions leading to dependency or recovery

## Research Applications

This model can be used to:

- Investigate mechanisms underlying substance use disorders
- Test hypotheses about microbiome-brain interactions
- Explore individual differences in addiction susceptibility
- Evaluate potential intervention strategies (probiotics, dietary modification)
- Teach concepts in computational biology and reinforcement learning

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is open-source and available for educational and research purposes.

## Version

Current Version: 1.0.0
Last Updated: 2026
