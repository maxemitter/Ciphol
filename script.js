const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // abcdefghijklmnopqrstuvwxyz
const substitutions = Array(letters.length).fill("?");
let words = new Set();

const letterInputs = Array(letters.length);

function init() {
    registerCiphertextFormHandler();
    createLetterContainer();
    update();
}

function registerCiphertextFormHandler() {
    const ciphertextForm = document.getElementById("ciphertextForm");
    ciphertextForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const added = new Set(
            new FormData(this)
                .get("txtCiphertext")
                .toUpperCase()
                .split(" ")
                .map((w) => w.trim())
                .filter(Boolean)
        );
        words = words.union(added);
        ciphertextForm.reset();
        update();
    });
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
    input.setAttribute("type", "text");
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
    updateWordTable();
}

function updateLetterContainer() {
    for (var i = 0; i < letters.length; i++) {
        letterInputs[i].value = substitutions[i];
    }
}

function updateWordTable() {
    const wordTableBody = document.getElementById("wordTableBody");

    if (words.size === 0) {
        wordTableBody.innerHTML = "<tr><td colspan=3>No data</td></tr>";
        return;
    }

    wordTableBody.innerHTML = "";
    words.forEach((word) => {
        const row = document.createElement("tr");
        const removeCell = document.createElement("td");
        const removeButton = document.createElement("button");
        removeButton.onclick = (e) => {
            e.preventDefault();
            words.delete(word);
            update();
        };
        removeButton.textContent = "X";
        removeCell.appendChild(removeButton);
        const cipherCell = document.createElement("td");
        cipherCell.textContent = word;
        const plainCell = document.createElement("td");
        plainCell.textContent = cipherToClear(word);
        row.append(removeCell, cipherCell, plainCell);
        wordTableBody.appendChild(row);
    });
}

function cipherToClear(cipher) {
    let clear = "";
    for (const char of cipher) {
        clear += substitutions[letters.indexOf(char)];
    }
    return clear;
}

init();
