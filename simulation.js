class MicrobiomeRLSimulation {
    constructor(params) {
        this.params = params;
        this.reset();
    }

    reset() {
        this.b0 = 100; 
        this.b1 = 900; 
        this.time = 0;
        
        this.qValues = {};
        for (let i = 0; i < this.params.numMeals; i++) {
            this.qValues[i] = 0;
        }
        this.currentAction = Math.floor(this.params.numMeals / 2);
        
        this.history = {
            time: [], b0: [], b1: [], diversity: [], kick: [], 
            actions: [], qValues: {}, b0Proportion: []
        };
        
        for (let i = 0; i < this.params.numMeals; i++) {
            this.history.qValues[i] = [];
        }
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

        const food = this.params.meals[this.currentAction];
        const p = this.params;
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

        let nextAction;
        if (Math.random() < p.epsilon) {
            nextAction = Math.floor(Math.random() * p.numMeals);
        } else {
            let maxQ = -Infinity;
            nextAction = 0;
            for (let i = 0; i < p.numMeals; i++) {
                if (this.qValues[i] > maxQ) {
                    maxQ = this.qValues[i];
                    nextAction = i;
                }
            }
        }

        let maxNextQ = -Infinity;
        for (let i = 0; i < p.numMeals; i++) {
            if (this.qValues[i] > maxNextQ) maxNextQ = this.qValues[i];
        }
        
        this.qValues[this.currentAction] += p.learningRate * 
            (reward + p.discount * maxNextQ - this.qValues[this.currentAction]);

        this.currentAction = nextAction;

        const currentTotal = this.b0 + this.b1;
        this.history.time.push(this.time);
        this.history.b0.push(this.b0);
        this.history.b1.push(this.b1);
        this.history.diversity.push(this.calculateShannonDiversity());
        this.history.kick.push(kick);
        this.history.actions.push(this.currentAction);
        this.history.b0Proportion.push(this.b0 / currentTotal);
        
        for (let i = 0; i < p.numMeals; i++) {
            this.history.qValues[i].push(this.qValues[i]);
        }

        this.time++;

        return {
            time: this.time, b0: this.b0, b1: this.b1,
            diversity: this.calculateShannonDiversity(), kick: kick,
            action: this.currentAction, qValues: { ...this.qValues },
            b0Proportion: this.b0 / currentTotal
        };
    }
}