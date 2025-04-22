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

    for (var i = 0; i < letters.length; i++) {
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
}

function updateLetterContainer() {
    for (var i = 0; i < letters.length; i++) {
        letterInputs[i].value = substitutions[i];
        letterInputs[i].classList.remove("invalid");
    }

    for (var i = 0; i < letters.length; i++) {
        for (var j = i + 1; j < letters.length; j++) {
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
            const upChar = char.toUpperCase();
            // TODO Should be able to just update and ignore the out of bounds access? Or maybe even use it?
            if (letters.includes(upChar)) {
                counts[letters.indexOf(upChar)]++;
            }
        }
    }

    const sum = counts.reduce((prev, cur) => prev + cur); // .reduce() ignores the value for -1
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

    var relevantCharFrequencies = charFrequencies;
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

init();
