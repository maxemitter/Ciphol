const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // abcdefghijklmnopqrstuvwxyz
const substitutions = Array(letters.length).fill("?");
let words = new Set();

function init() {
    registerCiphertextFormHandler();
    update();
}

function registerCiphertextFormHandler() {
    const ciphertextForm = document.getElementById("ciphertextForm");
    ciphertextForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const added = new Set(new FormData(this).get("txtCiphertext").toUpperCase().split(" ").map(w => w.trim()).filter(Boolean));
        words = words.union(added);
        ciphertextForm.reset();
        update();
    });
}

function update() {
    updateLetterContainer();
    updateWordTable();
}

function cipherToClear(cipher) {
    let clear = "";
    for (const char of cipher) {
        clear += substitutions[letters.indexOf(char)];
    }
    return clear;
}

function updateWordTable() {
    const wordTableBody = document.getElementById("wordTableBody");
    wordTableBody.innerHTML = "";

    words.forEach(word => {
        const row = document.createElement("tr");
        const removeCell = document.createElement("td");
        const removeButton = document.createElement("button");
        removeButton.onclick = () => {
            words.delete(word);
            update();
        };
        removeButton.textContent = "X";
        removeCell.appendChild(removeButton);
        const cipherCell = document.createElement("td");
        cipherCell.textContent = word;
        const plainCell = document.createElement("td");
        plainCell.textContent = cipherToClear(word);
        row.append(removeCell, cipherCell, plainCell)
        wordTableBody.appendChild(row);
    });
}

function updateLetterContainer() {
    const letterContainer = document.getElementById("letterContainer");
    letterContainer.innerHTML = "";

    for (var i = 0; i < letters.length; i++) {
        letterContainer.appendChild(createLetterBox(letters[i], substitutions[i]));
    }
}

function createLetterBox(letter, identified) {
    const letterBox = document.createElement("label");
    letterBox.className = "letterbox";
    const content = document.createElement("div");
    content.textContent = identified;
    letterBox.append(letter, content);
    return letterBox;
}

init();
