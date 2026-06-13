class MicrobiomeRLSimulation {
    constructor(params) {
        this.params = params;
        this.reset();
    }

    reset() {
        this.b0 = 100; 
        this.b1 = 900; 
        this.time = 0;
        
        this.qTable = {};
        this.currentAction = Math.floor(this.params.numMeals / 2);
        this.prevStateKey = null;
        
        this.history = {
            time: [], b0: [], b1: [], diversity: [], kick: [], 
            actions: [], qValues: {}, b0Proportion: []
        };
        
        for (let i = 0; i < this.params.numMeals; i++) {
            this.history.qValues[i] = [];
        }
    }

    getStateKey(b0, b1, kick, diversity) {
        const b0Bin = Math.min(9, Math.floor(b0 / 100));
        const b1Bin = Math.min(9, Math.floor(b1 / 100));
        const kickBin = Math.min(9, Math.floor(kick / 20));
        const divBin = Math.min(6, Math.floor(diversity * 10)); 
        return `${b0Bin}_${b1Bin}_${kickBin}_${divBin}`;
    }

    getQValues(stateKey) {
        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = new Array(this.params.numMeals).fill(0);
        }
        return this.qTable[stateKey];
    }

    calculateShannonDiversity() {
        const total = this.b0 + this.b1;
        if (total === 0) return 0;
        const p0 = this.b0 / total;
        const p1 = this.b1 / total;
        let h = 0;
        if (p0 > 0) h -= p0 * Math.log(p0);
        if (p1 > 0) h -= p1 * Math.log(p1);
        return h;
    }

    step() {
        if (this.time >= this.params.maxSteps) return null;

        const p = this.params;

        const food = this.params.meals[this.currentAction];
        const totalPop = this.b0 + this.b1;

        const b0Birth = this.b0 * p.b0Growth * (1 + food.alcohol * 4);
        const b1Birth = this.b1 * p.b1Growth * (1 + (food.sugar + food.protein + food.fiber) * 2);

        const densityStress = Math.pow(totalPop / p.carryingCap, 1.5);
        const b0Death = this.b0 * (p.b0Growth * 0.4) * (1 + densityStress);
        const b1Death = this.b1 * (p.b1Growth * 0.4) * (1 + densityStress);

        const inhibitionEffect = p.inhibition * this.b0 * this.b1 * 0.005;

        const noiseB0 = (Math.random() - 0.5) * 0.15 * this.b0;
        const noiseB1 = (Math.random() - 0.5) * 0.15 * this.b1;

        this.b0 = Math.max(10, this.b0 + b0Birth - b0Death + noiseB0);
        this.b1 = Math.max(10, this.b1 + b1Birth - b1Death - inhibitionEffect + noiseB1);

        const kick = this.b0 * p.chemProd;
        const reward = kick > p.kickThreshold ? kick * 1.5 : kick;
        const diversity = this.calculateShannonDiversity();

        const currentStateKey = this.getStateKey(this.b0, this.b1, kick, diversity);
        const currentQValues = this.getQValues(currentStateKey);

        if (this.time > 0 && this.prevStateKey !== null) {
            const prevQValues = this.getQValues(this.prevStateKey);
            const maxNextQ = Math.max(...currentQValues);

            prevQValues[this.currentAction] += p.learningRate * 
                (reward + p.discount * maxNextQ - prevQValues[this.currentAction]);
        }

        let nextAction;
        if (Math.random() < p.epsilon) {
            nextAction = Math.floor(Math.random() * p.numMeals);
        } else {
            let maxQ = -Infinity;
            nextAction = 0;
            for (let i = 0; i < p.numMeals; i++) {
                if (currentQValues[i] > maxQ) {
                    maxQ = currentQValues[i];
                    nextAction = i;
                }
            }
        }

        this.prevStateKey = currentStateKey;
        this.currentAction = nextAction;

        const currentTotal = this.b0 + this.b1;
        this.history.time.push(this.time);
        this.history.b0.push(this.b0);
        this.history.b1.push(this.b1);
        this.history.diversity.push(diversity);
        this.history.kick.push(kick);
        this.history.actions.push(this.currentAction);
        this.history.b0Proportion.push(this.b0 / currentTotal);
        
        for (let i = 0; i < p.numMeals; i++) {
            this.history.qValues[i].push(currentQValues[i]);
        }

        this.time++;

        return {
            time: this.time, b0: this.b0, b1: this.b1,
            diversity: diversity, kick: kick,
            action: this.currentAction, qValues: currentQValues,
            b0Proportion: this.b0 / currentTotal
        };
    }
}