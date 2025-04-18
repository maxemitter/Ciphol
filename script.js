const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // abcdefghijklmnopqrstuvwxyz
const identified = new Map();
const words = []; // TODO maybe just store cipher and calculate clear whenever needed? Then a set can be used here

function init() {
    registerCiphertextFormHandler();
    fillLetterContainer();
}

function registerCiphertextFormHandler() {
    const ciphertextForm = document.getElementById("ciphertextForm");
    ciphertextForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);
        const ciphertext = formData.get("txtCiphertext");
        console.log(ciphertext);
        ciphertext.split(" ").forEach((word) => {
            if (word.trim() !== ""
                && words.find(([cipher, _]) => cipher === word) === undefined) {
                words.push([word, cipherToClear(word)]);
            }
        })
        ciphertextForm.reset();
        updateWordTable();
    });
}

function cipherToClear(cipher) {
    let clear = "";
    for (const char in cipher) {
        clear += identified.get(char) || ".";
    }
    return clear;
}

function updateWordTable() {
    console.log(words);
    const wordTableBody = document.getElementById("wordTableBody");
    wordTableBody.innerHTML = ""

    words.forEach(([cipher, plain]) => {
        const row = document.createElement("tr");
        const removeCell = document.createElement("td");
        removeCell.textContent = "X";
        const cipherCell = document.createElement("td");
        cipherCell.textContent = cipher;
        const plainCell = document.createElement("td");
        plainCell.textContent = plain;
        row.append(removeCell, cipherCell, plainCell)
        wordTableBody.appendChild(row);
    });
}

function fillLetterContainer() {
    const letterContainer = document.getElementById("letterContainer");

    for (var i = 0; i < letters.length; i++) {
        letterContainer.appendChild(createLetterBox(letters[i]));
    }
}

function createLetterBox(letter) {
    const letterBox = document.createElement("label");
    letterBox.className = "letterbox";
    const content = document.createElement("div");
    content.textContent = "?";
    letterBox.append(letter, content);
    return letterBox;
}

init();