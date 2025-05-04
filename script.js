const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // abcdefghijklmnopqrstuvwxyz
const frequencies = [
    0.082, 0.015, 0.028, 0.043, 0.127, 0.022, 0.02, 0.061, 0.07, 0.0015, 0.0077,
    0.04, 0.024, 0.067, 0.075, 0.019, 0.00095, 0.06, 0.063, 0.091, 0.028,
    0.0098, 0.024, 0.0015, 0.02, 0.00074,
]; // Taken from https://en.wikipedia.org/wiki/Letter_frequency
const charFrequencies = frequencies
    .map((f, i) => [letters[i], f])
    .sort(([, f1], [, f2]) => f2 - f1);
const substitutions = Array(letters.length).fill("?");
const history = {
    rootNode: { value: substitutions.slice(), children: [] },
};
history.current = history.rootNode;

const letterInputs = Array(letters.length);

function init() {
    createCiphertextInput();
    createLetterContainer();
    registerCheckboxListeners();
    update();
}

function createCiphertextInput() {
    const ciphertextContainer = document.getElementById("ciphertextTable");
    const sampleRow = document.createElement("tr");
    const inputCell = document.createElement("td");
    const textareaInput = document.createElement("textarea");
    textareaInput.className = "textareaInput";
    textareaInput.placeholder = "Enter ciphertext sample";
    textareaInput.onbeforeinput = (e) => {
        if (
            !textareaInput.value &&
            e.data !== null &&
            ciphertextContainer.lastChild === sampleRow
        ) {
            createCiphertextInput();
        }
    };
    textareaInput.oninput = update;
    textareaInput.onblur = () => {
        if (
            !textareaInput.value &&
            ciphertextContainer.children.length > 1 &&
            ciphertextContainer.lastChild !== sampleRow
        ) {
            ciphertextContainer.removeChild(sampleRow);
        }
    };
    new ResizeObserver(() => {
        textareaOutput.style.height = textareaInput.offsetHeight + "px";
    }).observe(textareaInput);
    inputCell.appendChild(textareaInput);
    const outputCell = document.createElement("td");
    const textareaOutput = document.createElement("textarea");
    textareaOutput.className = "textareaOutput";
    textareaOutput.disabled = true;
    outputCell.appendChild(textareaOutput);
    sampleRow.append(inputCell, outputCell);
    ciphertextContainer.appendChild(sampleRow);
}

function createLetterContainer() {
    const letterContainer = document.getElementById("letterContainer");

    for (let i = 0; i < letters.length; i++) {
        letterContainer.appendChild(createLetterBox(i));
    }
}

function createLetterBox(index) {
    const letterBox = document.createElement("label");
    letterBox.className = "letterbox";
    const content = document.createElement("div");
    content.className = "letterboxContent";
    const input = document.createElement("input");
    input.className = "letterboxInput";
    input.type = "text";
    input.onbeforeinput = (e) => {
        e.preventDefault();

        if (e.data === null) {
            if (
                e.inputType === "deleteContentForward" ||
                e.inputType === "deleteContentBackward"
            ) {
                substitutions[index] = "?";
                update();
            }
            return;
        }

        const chars = e.data.trim().toUpperCase();
        const c = chars.charAt(chars.length - 1);
        if (c !== "?" && !letters.includes(c)) {
            return;
        }
        substitutions[index] = c;
        update();
    };
    input.value = substitutions[index];
    letterInputs[index] = input;
    content.appendChild(input);
    letterBox.append(letters[index], content);
    return letterBox;
}

function registerCheckboxListeners() {
    document.getElementById("suggUsedCipherCbx").onchange = update;
    document.getElementById("suggUsedClearCbx").onchange = update;
}

function update() {
    updateLetterContainer();
    updateTranslations();
    updateFrequencyAnalysis();
    updateHistory();
    drawHistory();
}

function updateLetterContainer() {
    for (let i = 0; i < letters.length; i++) {
        letterInputs[i].value = substitutions[i];
        letterInputs[i].classList.remove("invalid");
    }

    for (let i = 0; i < letters.length; i++) {
        for (let j = i + 1; j < letters.length; j++) {
            if (
                substitutions[i] === substitutions[j] &&
                substitutions[i] !== "?"
            ) {
                letterInputs[i].classList.add("invalid");
                letterInputs[j].classList.add("invalid");
            }
        }
    }
}

function updateTranslations() {
    const ciphertextTable = document.getElementById("ciphertextTable");
    for (const row of ciphertextTable.rows) {
        row.cells[1].lastChild.value = cipherToClear(
            row.cells[0].lastChild.value
        );
    }
}

function cipherToClear(cipher) {
    let clear = "";
    for (const char of cipher) {
        const upChar = char.toUpperCase();
        if (letters.includes(upChar)) {
            const sub = substitutions[letters.indexOf(upChar)];
            clear += char === upChar ? sub : sub.toLowerCase();
        } else {
            clear += char;
        }
    }
    return clear;
}

function updateFrequencyAnalysis() {
    const freqAnalTable = document.getElementById("freqAnalTableBody");
    const ciphertextTable = document.getElementById("ciphertextTable");

    const counts = new Array(letters.length).fill(0);
    for (const row of ciphertextTable.rows) {
        for (const char of row.cells[0].lastChild.value) {
            counts[letters.indexOf(char.toUpperCase())]++; // all relevant functions ignore the NaN at -1
        }
    }

    const sum = counts.reduce((prev, cur) => prev + cur);
    if (sum === 0) {
        freqAnalTable.innerHTML = "<tr><td colspan=5>No data</td></tr>";
        return;
    }

    let charCounts = counts
        .map((c, i) => [letters[i], c])
        .filter(([, count]) => count !== 0)
        .sort(([, c1], [, c2]) => c2 - c1);

    if (!document.getElementById("suggUsedCipherCbx").checked) {
        charCounts = charCounts.filter(
            ([char]) => substitutions[letters.indexOf(char)] === "?"
        );
    }

    let relevantCharFrequencies = charFrequencies;
    if (!document.getElementById("suggUsedClearCbx").checked) {
        relevantCharFrequencies = charFrequencies.filter(
            ([char]) => !substitutions.includes(char)
        );
    }

    freqAnalTable.innerHTML = "";
    const numAvailableSuggestions =
        charCounts.length < relevantCharFrequencies.length
            ? charCounts.length
            : relevantCharFrequencies.length;
    for (let i = 0; i < numAvailableSuggestions; i++) {
        [cipherChar, cipherCount] = charCounts[i];
        [suggClearChar, suggClearFreq] = relevantCharFrequencies[i];
        if (substitutions[letters.indexOf(cipherChar)] === suggClearChar) {
            continue;
        }
        const row = document.createElement("tr");
        const cipherCharCell = document.createElement("td");
        cipherCharCell.textContent = cipherChar;
        const cipherFreqCell = document.createElement("td");
        cipherFreqCell.textContent = formatFractionAsPercent(cipherCount / sum);
        const suggClearCharCell = document.createElement("td");
        suggClearCharCell.textContent = suggClearChar;
        const suggClearFreqCell = document.createElement("td");
        suggClearFreqCell.textContent = formatFractionAsPercent(suggClearFreq);
        const acceptCell = document.createElement("td");
        const acceptButton = document.createElement("button");
        acceptButton.textContent = "\u2713";
        acceptButton.onclick = createAcceptHandler(cipherChar, suggClearChar);
        acceptCell.appendChild(acceptButton);
        row.append(
            cipherCharCell,
            cipherFreqCell,
            suggClearCharCell,
            suggClearFreqCell,
            acceptCell
        );
        freqAnalTable.appendChild(row);
    }

    if (freqAnalTable.innerHTML === "") {
        freqAnalTable.innerHTML =
            "<tr><td colspan=5>No suggestions available</td></tr>";
    }
}

function formatFractionAsPercent(num) {
    return (100 * num).toFixed(2) + "%";
}

function createAcceptHandler(cipher, clear) {
    return () => {
        substitutions[letters.indexOf(cipher)] = clear;
        update();
    };
}

function updateHistory() {
    const contained = treeFind(history.rootNode, substitutions);
    if (contained) {
        history.current = contained;
        return;
    }

    const newCurrent = {
        value: substitutions.slice(),
        children: [],
    };
    history.current.children.push(newCurrent);
    history.current = newCurrent;
}

function treeFind(node, value) {
    if (arrayEquals(node.value, value)) {
        return node;
    }

    for (let child of node.children) {
        const found = treeFind(child, value);
        if (found) {
            return found;
        }
    }
    return undefined;
}

function arrayEquals(a1, a2) {
    if (!a1 || !a2 || a1.length !== a2.length) {
        return false;
    }

    for (let i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) {
            return false;
        }
    }
    return true;
}

function drawHistory() {
    const canvas = document.getElementById("historyCanvas");
    const canvasContext = canvas.getContext("2d");

    canvasContext.fillStyle = "white";
    canvasContext.fillRect(0, 0, canvas.height, canvas.width);
    canvasContext.fillStyle = "black";

    const height = 2 * 10 * requiredTreeWidth(history.rootNode);

    drawTree(
        canvasContext,
        history.rootNode,
        20,
        canvas.height / 2,
        Math.max(height, canvas.height - 20),
        -1,
        -1
    );
}

function requiredTreeWidth(node) {
    if (node.children.length === 0) {
        return 1;
    }

    let max = 0;
    for (let child of node.children) {
        max = Math.max(max, requiredTreeWidth(child));
    }
    return max * node.children.length;
}

function drawTree(canvasContext, node, x, y, space, px, py) {
    circle(canvasContext, x, y);
    if (px !== -1 && py !== -1) {
        line(canvasContext, x, y, px, py);
    }

    const childCount = node.children.length;
    const segmentSize = space / childCount;
    const startY = y - space / 2 + segmentSize / 2;

    for (let i = 0; i < childCount; i++) {
        drawTree(
            canvasContext,
            node.children[i],
            x + 30,
            startY + segmentSize * i,
            space / childCount,
            x,
            y
        );
    }
}

function circle(canvasContext, x, y) {
    canvasContext.beginPath();
    canvasContext.arc(x, y, 5, 0, Math.PI * 2);
    canvasContext.fill();
}

function line(canvasContext, x1, y1, x2, y2) {
    canvasContext.beginPath();
    canvasContext.moveTo(x1, y1);
    canvasContext.lineTo(x2, y2);
    canvasContext.stroke();
}

init();
