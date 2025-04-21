const towers = document.querySelectorAll('.tower');
const numDisksSelect = document.getElementById('numDisks');
const movesDisplay = document.getElementById('moves');
const minMovesDisplay = document.getElementById('minMoves');
const victoryMessage = document.getElementById('victoryMessage');
const solutionBtn = document.getElementById('solutionBtn');

// Array de cores para os discos
const diskColors = ['#EF4444', '#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899'];

let numDisks = 3;
let stacks = [[], [], []];
let heldDisk = null;
let moves = 0;
let isShowingSolution = false;
let solutionSteps = [];
let solutionIndex = 0;

function initGame() {
    numDisks = parseInt(numDisksSelect.value);
    stacks = [[], [], []];
    heldDisk = null;
    moves = 0;
    isShowingSolution = false;
    solutionSteps = [];
    solutionIndex = 0;

    movesDisplay.textContent = moves;
    minMovesDisplay.textContent = Math.pow(2, numDisks) - 1;

    towers.forEach(t => t.innerHTML = '<div class="bg-gray-700 w-2 h-full"></div>');

    for (let i = numDisks; i >= 1; i--) {
        const disk = document.createElement('div');
        disk.className = 'disk text-white text-center rounded shadow';
        disk.style.width = `${60 + i * 20}px`;
        disk.style.height = '30px';
        disk.style.zIndex = `${i}`;
        disk.style.backgroundColor = diskColors[(numDisks - i) % diskColors.length]; // Atribui uma cor única
        disk.dataset.size = i;
        disk.draggable = true;
        disk.addEventListener('dragstart', dragStart);
        disk.addEventListener('touchstart', touchStart, { passive: true });
        towers[0].appendChild(disk);
        stacks[0].push(disk);
    }
    updateDisks();
}

function updateDisks() {
    towers.forEach((tower, tIdx) => {
        stacks[tIdx].forEach((disk, dIdx) => {
            disk.style.left = '50%';
            disk.style.transform = 'translateX(-50%)';
            disk.style.bottom = `${dIdx * 35}px`;
        });
    });
}

function dragStart(e) {
    if (isShowingSolution) return e.preventDefault();
    const disk = e.target;
    const towerIdx = [...towers].findIndex(t => t.contains(disk));
    if (stacks[towerIdx][stacks[towerIdx].length - 1] !== disk) {
        e.preventDefault();
        return;
    }
    heldDisk = disk;
}

function touchStart(e) {
    if (isShowingSolution) return;
    const disk = e.target;
    const towerIdx = [...towers].findIndex(t => t.contains(disk));
    if (stacks[towerIdx][stacks[towerIdx].length - 1] !== disk) return;
    heldDisk = disk;
}

towers.forEach((tower, tIdx) => {
    tower.addEventListener('dragover', e => e.preventDefault());
    tower.addEventListener('drop', () => dropDisk(tIdx));
    tower.addEventListener('touchend', () => dropDisk(tIdx));
});

function dropDisk(towerIdx) {
    if (!heldDisk || isShowingSolution) return;

    const fromIdx = [...towers].findIndex(t => t.contains(heldDisk));
    if (stacks[fromIdx][stacks[fromIdx].length - 1] !== heldDisk) return;

    const toStack = stacks[towerIdx];
    const heldSize = parseInt(heldDisk.dataset.size);
    const topToSize = toStack.length > 0 ? parseInt(toStack[toStack.length - 1].dataset.size) : Infinity;

    if (heldSize < topToSize) {
        moveDisk(fromIdx, towerIdx);
        moves++;
        movesDisplay.textContent = moves;
        checkWin();
    }

    heldDisk = null;
}

function moveDisk(from, to) {
    const disk = stacks[from].pop();
    stacks[to].push(disk);

    towers[from].removeChild(disk);
    towers[to].appendChild(disk);

    // Aplica a animação visual
    disk.classList.add('animate-move');
    setTimeout(() => disk.classList.remove('animate-move'), 300); // remove após 0.3s

    updateDisks();
}

function checkWin() {
    if (
        stacks[2].length === numDisks &&
        stacks[2].every((disk, i, arr) => i === 0 || parseInt(arr[i - 1].dataset.size) > parseInt(disk.dataset.size))
    ) {
        victoryMessage.classList.remove('hidden');
        setTimeout(() => victoryMessage.classList.add('hidden'), 2000);
    }
}

function generateSolution() {
    solutionSteps = [];
    solveHanoi(numDisks, 0, 2, 1);
}

function solveHanoi(n, from, to, aux) {
    if (n === 1) {
        solutionSteps.push([from, to]);
    } else {
        solveHanoi(n - 1, from, aux, to);
        solutionSteps.push([from, to]);
        solveHanoi(n - 1, aux, to, from);
    }
}

function showSolution() {
    solutionBtn.disabled = true;
    solutionIndex = 0;
    isShowingSolution = true;
    initGame();
    generateSolution();
    moveStep();
}

function moveStep() {
    if (solutionIndex < solutionSteps.length) {
        const [from, to] = solutionSteps[solutionIndex];

        const disk = stacks[from].pop();
        stacks[to].push(disk);

        // Obtém a posição atual
        const fromTower = towers[from];
        const toTower = towers[to];

        const fromRect = fromTower.getBoundingClientRect();
        const toRect = toTower.getBoundingClientRect();
        const diskRect = disk.getBoundingClientRect();

        const deltaX = toRect.left - fromRect.left;
        const targetBottom = (stacks[to].length - 1) * 35; // Posição final na pilha destino

        // Calcula a altura do arco com base na distância horizontal
        const arcHeight = Math.abs(deltaX) * 0.5 + 50; // Arco proporcional à distância (mínimo 50px)

        // Temporariamente anexa ao body pra animar no espaço global
        const clone = disk.cloneNode(true);
        document.body.appendChild(clone);

        const diskStyle = window.getComputedStyle(disk);
        clone.style.position = "fixed";
        clone.style.left = diskRect.left + "px";
        clone.style.top = diskRect.top + "px";
        clone.style.width = diskStyle.width;
        clone.style.height = diskStyle.height;
        clone.style.backgroundColor = diskStyle.backgroundColor;
        clone.style.zIndex = "2000"; // Alto z-index para ficar acima de tudo
        clone.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"; // Curva de easing suave
        clone.classList.add('disk', 'text-white', 'text-center', 'rounded', 'shadow'); // Aplica estilos do disco

        disk.style.visibility = "hidden"; // Esconde o original

        // Move visualmente em um arco direcionado
        setTimeout(() => {
            // Subida em arco, proporcional à distância entre torres
            clone.style.transform = `translate(${deltaX / 2}px, -${arcHeight}px)`;
        }, 50);

        // Após o arco, move para a posição final na pilha
        setTimeout(() => {
            clone.style.transition = "transform 0.4s ease-out";
            clone.style.transform = `translate(${deltaX}px, ${diskRect.top - toRect.bottom + targetBottom}px)`;
        }, 450);

        // Após a transição, remove o clone e mostra o disco no destino
        setTimeout(() => {
            towers[to].appendChild(disk);
            disk.style.visibility = "visible";
            updateDisks();
            clone.remove();
            solutionIndex++;
            setTimeout(moveStep, 300); // Chama o próximo passo
        }, 850);
    } else {
        // Reativa o botão e redefine o estado
        solutionBtn.disabled = false;
        isShowingSolution = false; // Permite novas interações
    }
}

document.getElementById('restartBtn').addEventListener('click', initGame);
solutionBtn.addEventListener('click', showSolution);
window.onload = initGame;