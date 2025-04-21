const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // abcdefghijklmnopqrstuvwxyz
const substitutions = Array(letters.length).fill("?");

const letterInputs = Array(letters.length);

function init() {
    createCiphertextInput();
    createLetterContainer();
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

function update() {
    updateLetterContainer();
    updateTranslations();
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
        clear += letters.includes(char)
            ? substitutions[letters.indexOf(char)]
            : char;
    }
    return clear;
}

init();
