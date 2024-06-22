let a = document.addEventListener("DOMContentLoaded", function () {
  let keyboardRow1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  let keyboardRow2 = ["a", "s", "d","f", "g", "h", "j", "k", "l"];
  let keyboardRow3 = ['<span><span class="keyboard-enter">Enter</span><i class="fa-solid fa-arrow-turn-down"></i></span>', "z", "x", "c", "v", "b", "n", "m", '<i class="fa-solid fa-delete-left"></i>'];

  const keyboard = document.getElementById("keyboard");

  if (!keyboard) {
    return;
  }
  
  function createKeyboardRow(row) {
    const keyboardRow = document.createElement("div");
    keyboardRow.classList.add("keyboard-row");
    row.forEach((key) => {
      const keyElement = document.createElement("div");
      keyElement.classList.add("keyboard-key");
      keyElement.innerHTML = key;

      if (key === '<span><span class="keyboard-enter">Enter</span><i class="fa-solid fa-arrow-turn-down"></i></span>') {
        key = "enter";
      }

      if (key === '<i class="fa-solid fa-delete-left"></i>') {
        key = "delete";
      }

      addListenerToKeys(keyElement, key);
      keyboardRow.appendChild(keyElement, key);
    });
    keyboard.appendChild(keyboardRow);
  }
  
  function addListenerToKeys(keyElement, key) {
    keyElement.addEventListener("click", function () {
      const event = new CustomEvent("keyClick", {detail: key});
      keyboard.dispatchEvent(event);
    });
  }

  createKeyboardRow(keyboardRow1);
  createKeyboardRow(keyboardRow2);
  createKeyboardRow(keyboardRow3);

  return keyboard;
});

