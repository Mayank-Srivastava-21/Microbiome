document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnResume = document.getElementById('btn-resume');
    const btnStop = document.getElementById('btn-stop');
    const btnReset = document.getElementById('btn-reset');
    const statusText = document.getElementById('status-text');
    const stepCounter = document.getElementById('step-counter');
    const numMealsInput = document.getElementById('num-meals');
    const mealsContainer = document.getElementById('meals-container');
    const modal = document.getElementById('graph-modal');
    const modalClose = document.getElementById('modal-close');
    const modalDownload = document.getElementById('modal-download');
    const modalTitle = document.getElementById('modal-title');

    let simulation = null;
    let intervalId = null;
    let isRunning = false;
    let isPaused = false;
    let modalChart = null;
    let currentModalChartName = null;

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
    Chart.defaults.scale.grid.color = '#f1f5f9';

    const charts = {};

    function createChart(ctx, datasets, yLabel) {
        return new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } } } },
                scales: {
                    x: { title: { display: true, text: 'Time Step' }, ticks: { maxTicksLimit: 10 } },
                    y: { title: { display: true, text: yLabel }, beginAtZero: true }
                }
            }
        });
    }

    charts.microbiome = createChart(
        document.getElementById('chart-microbiome').getContext('2d'),
        [
            { label: 'B0 (Alcohol-tolerant)', data: [], borderColor: '#ef4444', borderWidth: 1.5, pointRadius: 0, tension: 0.3 },
            { label: 'B1 (Commensal)', data: [], borderColor: '#3b82f6', borderWidth: 1.5, pointRadius: 0, tension: 0.3 }
        ], 'Population Size'
    );

    charts.diversity = createChart(
        document.getElementById('chart-diversity').getContext('2d'),
        [{ label: 'Shannon Index', data: [], borderColor: '#10b981', borderWidth: 2, pointRadius: 0, tension: 0.3 }],
        'Diversity Index (H)'
    );

    charts.kick = createChart(
        document.getElementById('chart-kick').getContext('2d'),
        [{ label: 'Chemical Signal', data: [], borderColor: '#f59e0b', borderWidth: 2, pointRadius: 0, tension: 0.3 }],
        'Concentration'
    );

    charts.qvalues = createChart(
        document.getElementById('chart-qvalues').getContext('2d'), [], 'Expected Reward'
    );

    charts.mealchoice = createChart(
        document.getElementById('chart-mealchoice').getContext('2d'),
        [{ label: 'Selected Meal Index', data: [], borderColor: '#8b5cf6', borderWidth: 2, pointRadius: 3, step: 'after' }],
        'Meal Index'
    );

    charts.ratio = createChart(
        document.getElementById('chart-ratio').getContext('2d'),
        [{ label: 'B0 Proportion', data: [], borderColor: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.1)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.3 }],
        'Proportion (0 to 1)'
    );

    document.querySelectorAll('.btn-expand').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chartName = e.currentTarget.getAttribute('data-chart');
            openModal(chartName);
        });
    });

    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chartName = e.currentTarget.getAttribute('data-chart');
            downloadChart(charts[chartName], chartName);
        });
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    
    modalDownload.addEventListener('click', () => {
        if (modalChart) downloadChart(modalChart, currentModalChartName + '_expanded');
    });

    function openModal(chartName) {
        currentModalChartName = chartName;
        const sourceChart = charts[chartName];
        modalTitle.textContent = sourceChart.options.scales.y.title.text + ' - Expanded View';
        
        if (modalChart) modalChart.destroy();
        
        const ctx = document.getElementById('modal-canvas').getContext('2d');
        modalChart = new Chart(ctx, {
            type: sourceChart.config.type,
            data: JSON.parse(JSON.stringify(sourceChart.data)),
            options: {
                ...sourceChart.options,
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 15, usePointStyle: true, font: { size: 14 } } }
                },
                scales: {
                    x: { ...sourceChart.options.scales.x, ticks: { maxTicksLimit: 20 } },
                    y: { ...sourceChart.options.scales.y, title: { ...sourceChart.options.scales.y.title, font: { size: 14 } } }
                }
            }
        });
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        if (modalChart) { modalChart.destroy(); modalChart = null; }
    }

    function downloadChart(chart, filename) {
        if (!chart) return;
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = chart.toBase64Image();
        link.click();
    }

    function normalizeNutrients(mealIndex, changedField) {
        const alcoholInput = document.getElementById(`meal-${mealIndex}-alcohol`);
        const sugarInput = document.getElementById(`meal-${mealIndex}-sugar`);
        const proteinInput = document.getElementById(`meal-${mealIndex}-protein`);
        const fiberInput = document.getElementById(`meal-${mealIndex}-fiber`);

        let alcohol = parseFloat(alcoholInput.value) || 0;
        let sugar = parseFloat(sugarInput.value) || 0;
        let protein = parseFloat(proteinInput.value) || 0;
        let fiber = parseFloat(fiberInput.value) || 0;

        const total = alcohol + sugar + protein + fiber;

        if (total !== 100 && total > 0) {
            const scale = 100 / total;
            
            if (changedField !== 'alcohol') alcohol = alcohol * scale;
            if (changedField !== 'sugar') sugar = sugar * scale;
            if (changedField !== 'protein') protein = protein * scale;
            if (changedField !== 'fiber') fiber = fiber * scale;

            alcoholInput.value = Math.round(alcohol * 10) / 10;
            sugarInput.value = Math.round(sugar * 10) / 10;
            proteinInput.value = Math.round(protein * 10) / 10;
            fiberInput.value = Math.round(fiber * 10) / 10;
        }
    }

    function createMealInputs(numMeals) {
        mealsContainer.innerHTML = '';
        for (let i = 0; i < numMeals; i++) {
            const mealDiv = document.createElement('div');
            mealDiv.className = 'meal-config';
            mealDiv.innerHTML = `
                <div class="meal-config-header"><h4>Meal ${i + 1}</h4></div>
                <div class="nutrient-inputs">
                    <div class="input-group"><label>Alcohol %</label><input type="number" id="meal-${i}-alcohol" value="${i === 0 ? 60 : 10}" step="5" min="0" max="100" data-meal="${i}" data-field="alcohol"></div>
                    <div class="input-group"><label>Sugar %</label><input type="number" id="meal-${i}-sugar" value="${i === 0 ? 10 : 40}" step="5" min="0" max="100" data-meal="${i}" data-field="sugar"></div>
                    <div class="input-group"><label>Protein %</label><input type="number" id="meal-${i}-protein" value="${i === 0 ? 20 : 40}" step="5" min="0" max="100" data-meal="${i}" data-field="protein"></div>
                    <div class="input-group"><label>Fiber %</label><input type="number" id="meal-${i}-fiber" value="${i === 0 ? 10 : 10}" step="5" min="0" max="100" data-meal="${i}" data-field="fiber"></div>
                </div>`;
            mealsContainer.appendChild(mealDiv);
        }

        document.querySelectorAll('.nutrient-inputs input').forEach(input => {
            input.addEventListener('change', (e) => {
                const mealIndex = parseInt(e.target.getAttribute('data-meal'));
                const field = e.target.getAttribute('data-field');
                normalizeNutrients(mealIndex, field);
            });
        });
    }

    createMealInputs(3);
    numMealsInput.addEventListener('change', (e) => createMealInputs(parseInt(e.target.value)));

    function getParams() {
        const numMeals = parseInt(document.getElementById('num-meals').value);
        const meals = [];
        for (let i = 0; i < numMeals; i++) {
            meals.push({
                name: `Meal ${i + 1}`,
                alcohol: parseFloat(document.getElementById(`meal-${i}-alcohol`).value) / 100,
                sugar: parseFloat(document.getElementById(`meal-${i}-sugar`).value) / 100,
                protein: parseFloat(document.getElementById(`meal-${i}-protein`).value) / 100,
                fiber: parseFloat(document.getElementById(`meal-${i}-fiber`).value) / 100
            });
        }
        return {
            b0Growth: parseFloat(document.getElementById('b0-growth').value),
            b1Growth: parseFloat(document.getElementById('b1-growth').value),
            inhibition: parseFloat(document.getElementById('inhibition').value),
            carryingCap: parseFloat(document.getElementById('carrying-cap').value),
            chemProd: parseFloat(document.getElementById('chem-prod').value),
            learningRate: parseFloat(document.getElementById('learning-rate').value),
            discount: parseFloat(document.getElementById('discount').value),
            epsilon: parseFloat(document.getElementById('epsilon').value),
            kickThreshold: parseFloat(document.getElementById('kick-thresh').value),
            simSpeed: parseInt(document.getElementById('sim-speed').value),
            maxSteps: parseInt(document.getElementById('max-steps').value),
            numMeals, meals
        };
    }

    function updateControls() {
        btnStart.disabled = isRunning || isPaused;
        btnPause.disabled = !isRunning;
        btnResume.disabled = !isPaused;
        btnStop.disabled = !isRunning && !isPaused;
        statusText.textContent = isRunning ? 'Status: Running' : isPaused ? 'Status: Paused' : 'Status: Idle';
        statusText.style.color = isRunning ? '#10b981' : isPaused ? '#f59e0b' : '#64748b';
    }

    function updateGraphs(data, numMeals) {
        function pushData(chart, index, val) {
            chart.data.labels.push(data.time);
            if (chart.data.datasets[index]) {
                chart.data.datasets[index].data.push(val);
            }
        }

        pushData(charts.microbiome, 0, data.b0);
        pushData(charts.microbiome, 1, data.b1);
        pushData(charts.diversity, 0, data.diversity);
        pushData(charts.kick, 0, data.kick);
        pushData(charts.ratio, 0, data.b0Proportion);
        pushData(charts.mealchoice, 0, data.action);

        if (charts.qvalues.data.datasets.length !== numMeals) {
            const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6'];
            charts.qvalues.data.datasets = [];
            for (let i = 0; i < numMeals; i++) {
                charts.qvalues.data.datasets.push({
                    label: `Meal ${i + 1}`, 
                    data: [], 
                    borderColor: colors[i % colors.length], 
                    borderWidth: 2, 
                    pointRadius: 0, 
                    tension: 0.3
                });
            }
        }
        
        charts.qvalues.data.labels.push(data.time);
        
        for (let i = 0; i < numMeals; i++) {
            if (charts.qvalues.data.datasets[i]) {
                charts.qvalues.data.datasets[i].data.push(data.qValues[i]);
            }
        }

        Object.values(charts).forEach(c => {
            c.data.datasets.forEach(ds => {
                while (ds.data.length < c.data.labels.length) {
                    ds.data.push(ds.data.length > 0 ? ds.data[ds.data.length - 1] : 0);
                }
            });
            c.update('none');
        });
        
        stepCounter.textContent = `Step: ${data.time} / ${simulation.params.maxSteps}`;
    }

    function runStep() {
        const data = simulation.step();
        if (data) {
            updateGraphs(data, simulation.params.numMeals);
        } else {
            stopSimulation();
            statusText.textContent = 'Status: Completed';
            statusText.style.color = '#3b82f6';
        }
    }

    function startSimulation() {
        const params = getParams();
        simulation = new MicrobiomeRLSimulation(params);
        Object.values(charts).forEach(c => { 
            c.data.labels = []; 
            c.data.datasets.forEach(ds => ds.data = []); 
            c.update(); 
        });
        isRunning = true; 
        isPaused = false; 
        updateControls();
        intervalId = setInterval(runStep, params.simSpeed);
    }

    function pauseSimulation() { 
        isRunning = false; 
        isPaused = true; 
        clearInterval(intervalId); 
        updateControls(); 
    }
    
    function resumeSimulation() { 
        isRunning = true; 
        isPaused = false; 
        updateControls(); 
        intervalId = setInterval(runStep, simulation.params.simSpeed); 
    }
    
    function stopSimulation() { 
        isRunning = false; 
        isPaused = false; 
        clearInterval(intervalId); 
        updateControls(); 
    }
    
    function resetSimulation() {
        stopSimulation();
        Object.values(charts).forEach(c => { 
            c.data.labels = []; 
            c.data.datasets.forEach(ds => ds.data = []); 
            c.update(); 
        });
        stepCounter.textContent = `Step: 0 / ${getParams().maxSteps}`;
    }

    btnStart.addEventListener('click', startSimulation);
    btnPause.addEventListener('click', pauseSimulation);
    btnResume.addEventListener('click', resumeSimulation);
    btnStop.addEventListener('click', stopSimulation);
    btnReset.addEventListener('click', resetSimulation);

    updateControls();
});