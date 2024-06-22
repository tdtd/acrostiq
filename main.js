document.addEventListener("DOMContentLoaded", function () {
  // Puzzle data
  let loaded = false;

  let answerWord = ""; // Example answer word
  let hintWords = [];

  let lives = 3;

  // Global Variables
  let puzzleWords = [];
  let stats = {};
  let ctrlDown = false;

  let recentInput = null;
  let recentInputIndex = null;
  let recentWordIndex = null;
  let recentInputs = null;
  let recentWordDiv = null;

  let date = newDate();

  // Load puzzle into the container
  const puzzleContainer = document.getElementById("puzzle-container");
  const keyboard = document.getElementById("keyboard");
  const chart = document.getElementById("chart");
  let helpContainerClose = document.getElementById("help-close");
  let helpButton = document.getElementById("help-button");
  let helpPopup = document.getElementById("help-popup");
  let statsContainerClose = document.getElementById("stats-close");
  let statsButton = document.getElementById("stats-button");
  let statsPopup = document.getElementById("stats-popup");
  /*
  let settingsContainerClose = document.getElementById("settings-close");
  let settingsButton = document.getElementById("settings-button");
  let settingsPopup = document.getElementById("settings-popup");
  */

  function newDate() {
    let date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
  }

  /*

  Firebase Functions

  */

  async function getPuzzleData() {
    const data = puzzleJSON;
    return data;
  }

  /*

  Game Setup

  */
  async function setupGame() {
    // Load the puzzle data
    let puzzleJSON = await getPuzzleData();

    answerWord = puzzleJSON.answer;
    hintWords = puzzleJSON.hintWords;

    // Reveal the game
    revealGame();

    // Populate the inputs
    populateInputs(
      puzzleJSON.author,
      puzzleJSON.title,
      new Date(puzzleJSON.date),
      hintWords
    );

    // Load the stats
    let pointArray = loadStats();

    // Set the chart data
    setChartData(chart, pointArray);

    // Set the lives
    drawLives();
  }

  function revealGame() {
    //hide the loading screen and show the game
    let loadingScreen = document.getElementById("loading");
    let gameScreen = document.getElementById("game");

    loadingScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
  }

  /*

  Game Functions

  */

  function checkSingleCorrectField(puzzleWords, wordIndex) {
    //Check if only one word has correct values
    let wordGuess = puzzleWords[wordIndex].querySelectorAll("input");
    let guess = [...wordGuess].map((input) => input.value).join("");
    if (guess.toLowerCase() === hintWords[wordIndex].word.toLowerCase()) {
      puzzleWords[wordIndex].classList.remove("wrong");
      puzzleWords[wordIndex].classList.add("right");
      let puzzleInputs = puzzleWords[wordIndex].querySelectorAll("input");
      puzzleInputs.forEach((elem) => (elem.disabled = true));
    } else {
      puzzleWords[wordIndex].classList.add("wrong");
      puzzleWords[wordIndex].classList.remove("right");
    }

    return guess.toLowerCase() === hintWords[wordIndex].word.toLowerCase();
  }

  function checkSingleFieldFull(puzzleWord) {
    if (!checkHintFieldsFull([puzzleWord])) return false;

    let inputs = [...puzzleWord.querySelectorAll("input")].map(
      (input) => input.value
    );
    return inputs.every((value) => value.length > 0);
  }

  function checkHintFieldsFull(puzzleWordList) {
    return puzzleWordList.every((elem) => {
      let inputs = [...elem.querySelectorAll("input")].map(
        (input) => input.value
      );
      return inputs.every((value) => value.length > 0);
    });
  }

  function checkFirstLetterCorrect(word, inputs) {
    let firstLetter = word[0];
    let firstInput = inputs[0];

    if (inputs[0].disabled) return false;

    return firstInput.value.toLowerCase() === firstLetter.toLowerCase();
  }

  function checkAllCorrect(puzzleWords) {
    let allCorrect = puzzleWords.every((word) =>
      word.classList.contains("right")
    );
    return allCorrect;
  }

  function markWordCorrect(puzzleWord) {
    puzzleWord.classList.remove("wrong");
    puzzleWord.classList.add("right");
    let puzzleInputs = puzzleWord.querySelectorAll("input");
    puzzleInputs.forEach((elem) => (elem.disabled = true));
  }

  function markFirstLetterCorrect(puzzleWord) {
    puzzleWord.classList.add("first-letter-correct");
    let puzzleInputs = puzzleWord.querySelectorAll("input");
    puzzleInputs[0].disabled = true;
  }

  function moveToNextHintWord(puzzleWords, wordIndex) {
    //Get ready to move to the next word,
    //try until you find a word that isn't marked right.
    //If you reach the end, go back to the beginning and check until you check the word you started on
    //puzzleWords[nextIndex].querySelector("input").focus();

    let nextIndex = wordIndex + 1;

    for (let i = nextIndex; i !== wordIndex; i++) {
      if (i >= puzzleWords.length) {
        i = 0;
      }

      if (!puzzleWords[i].classList.contains("right")) {
        nextIndex = i;
        break;
      }
    }

    let [inputs, lastLetter] = selectLastFilledInput(puzzleWords, nextIndex);

    if (inputs == null || lastLetter == null) return;
    inputs[lastLetter].focus();
  }

  function moveToPreviousHintWord(puzzleWords, wordIndex) {
    let nextIndex = -1;

    if (wordIndex - 1 < 0) {
      return;
    }

    for (i = wordIndex - 1; i >= 0; i--) {
      if (nextIndex == -1 && !puzzleWords[i].classList.contains("right")) {
        nextIndex = i;
      }
    }

    if (nextIndex == -1) return;

    let [inputs, lastLetter] = selectLastFilledInput(puzzleWords, nextIndex);
    inputs[lastLetter].focus();
  }

  function moveToNextInput(inputs, inputIndex) {
    inputs[inputIndex + 1].focus();
  }

  function moveToPreviousInput(inputs, inputIndex, wordIndex) {
    // Check if the next Input is < 0, if so move to the previous word
    // Check if the next Input is 0, if so, check if its disabled, if so, move to the previous word
    // move to the previous input
    let nextIndex = inputIndex - 1;

    if (nextIndex < 0 && wordIndex == 0) return;

    //if first is empty, move to the previous word, if its not don't move
    if (nextIndex < 0 && inputs[inputIndex].value == "") {
      return moveToPreviousHintWord(puzzleWords, wordIndex);
    } else if (nextIndex < 0) {
      return;
    }

    //if first is disabled, move to the previous word
    if (nextIndex == 0 && inputs[nextIndex].disabled)
      return moveToPreviousHintWord(puzzleWords, wordIndex);

    inputs[nextIndex].focus();
  }

  function deleteInputValue(inputs, inputIndex, input, wordIndex) {
    moveToPreviousInput(inputs, inputIndex, wordIndex);
    inputs[inputIndex].value = "";
  }

  function selectLastFilledInput(puzzleWords, nextIndex) {
    if (puzzleWords[nextIndex] == undefined) return [null, null];
    let inputs = puzzleWords[nextIndex].querySelectorAll("input");
    let inputValues = [...inputs].map((input) => input.value);
    let lastLetter = 0;

    for (let i = 0; i < inputValues.length; i++) {
      if (inputValues[i].length > 0) {
        lastLetter = i + 1 <= inputValues[i].length - 1 ? i + 1 : i;
      }
    }

    if (
      lastLetter == 0 &&
      puzzleWords[nextIndex].classList.contains("first-letter-correct")
    ) {
      lastLetter = 1;
    }

    return [inputs, lastLetter];
  }

  function submitAnswer(wordDiv, hintWord, inputs, wordIndex) {
    if (checkSingleFieldFull(wordDiv)) {
      if (checkAllCorrect(puzzleWords)) return;

      let firstCorrect = checkFirstLetterCorrect(hintWord.word, inputs);
      let wordCorrect = checkSingleCorrectField(puzzleWords, wordIndex);

      if (wordCorrect) {
        markWordCorrect(wordDiv);
        markFirstLetterCorrect(wordDiv);
        if (checkAllCorrect(puzzleWords)) {
          endGame(true);
        }
      } else if (firstCorrect) {
        markFirstLetterCorrect(wordDiv);
        shakeElement(wordDiv, true);
      } else {
        shakeElement(wordDiv);
        lives--;
        removeLife();
      }
    }

    setTimeout(() => {
      drawLives();
    }, 500);
  }

  function removeLife() {
    if (lives <= 0) {
      endGame(true);
      return;
    }

    //add .lost class to the first life
    let livesContainer = document.getElementById("lives");
    let lifeDivs = livesContainer.querySelectorAll(".life");
    let firstLife = lifeDivs[0];
    firstLife.classList.add("lost");
  }

  function drawLives() {
    let livesContainer = document.getElementById("lives");
    livesContainer.innerHTML = "";
    for (let i = 0; i < lives; i++) {
      let life = document.createElement("div");
      life.classList.add("life");
      livesContainer.appendChild(life);
    }
  }

  function setChartData(chart, data, highlight = -1) {
    let max = Math.max(...data);
    //set labels above each bar
    chart.innerHTML = "";

    let labelTop = document.createElement("div");
    labelTop.classList.add("chart-row", "label-top");

    let chartDiv = document.createElement("div");
    chartDiv.classList.add("chart-row", "chart-display");

    let labelBottom = document.createElement("div");
    labelBottom.classList.add("chart-row", "label-bottom");

    for (let i = 0; i < data.length; i++) {
      const label = document.createElement("div");
      label.classList.add("num-label", "bar-below");
      label.innerText = `${i + 1}`;
      labelTop.appendChild(label);
    }

    for (let i = 0; i < data.length; i++) {
      const bar = document.createElement("div");
      bar.classList.add("bar");
      bar.style.height = `${(data[i] / max) * 100}%`;
      if (i == highlight) bar.classList.add("highlight");
      chartDiv.appendChild(bar);
    }

    /*
    for (let i = 0; i < data.length; i++) {
      const label = document.createElement("div");
      label.classList.add("num-label", "bar-above");
      label.innerText = data[i];
      labelBottom.appendChild(label);
    }
    */

    chart.appendChild(chartDiv);
    chart.appendChild(labelTop);
    chart.appendChild(labelBottom);
  }

  function shakeElement(element, firstLetterCorrect = false) {
    className = firstLetterCorrect ? "dont-shake-first-letter" : "shake";

    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, 500);
  }

  function endGame(submitted = false) {
    // Disable all inputs
    // Show the answer in the stats container
    // Show a message
    let answer = document.getElementById("answer");
    let answerTextBox = answer.querySelector("#answer-text");
    let clueAnswers = answer.querySelector("#clue-answers");
    let pointCalcContainer = document.querySelector("#point-calc-container");
    let averageElement = document.getElementById("average");
    let totalWinsElement = document.getElementById("total-wins");
    let currentWinStreakElement = document.getElementById("current-win-streak");
    let longestWinStreakElement = document.getElementById("longest-win-streak");

    let {
      correctWordPoints,
      correctFirstLetterPoints,
      bonusPoints,
      totalPoints,
    } = tabulateScores();

    //Disable all inputs
    puzzleWords.forEach((word) => {
      let inputs = word.querySelectorAll("input");
      inputs.forEach((input) => {
        input.disabled = true;
      });
    });

    //Show the answer
    answer.classList.remove("hidden");
    answerTextBox.textContent = answerWord;

    //Show the clues
    hintWords.forEach(({ word, hint }) => {
      let clue = document.createElement("div");
      clue.classList.add("clue-answer");

      //Hint Text
      let hintElement = document.createElement("span");
      hintElement.className = "hint-text";
      hintElement.textContent = hint;

      //Clue Text
      let clueElement = document.createElement("span");
      let clueFirstLetterElement = document.createElement("span");
      let clueRestOfWordElement = document.createElement("span");
      clueElement.className = "clue-text";

      clueFirstLetterElement.className = "first-letter-text";
      clueFirstLetterElement.textContent = word[0];

      clueRestOfWordElement.className = "rest-of-word-text";
      clueRestOfWordElement.textContent = word.slice(1);

      clueElement.appendChild(clueFirstLetterElement);
      clueElement.appendChild(clueRestOfWordElement);
      clue.appendChild(clueElement);

      clue.appendChild(hintElement);
      clueAnswers.appendChild(clue);

      statsPopup.classList.remove("hidden");
      toggleScroll();
    });

    //show the points calculation
    pointCalcContainer.classList.remove("hidden");

    //Show points on score board
    let correctWordPointsElement = document.getElementById(
      "correct-word-points"
    );
    let correctFirstLetterPointsElement = document.getElementById(
      "correct-first-letter-points"
    );
    let solvedPointsElement = document.getElementById("solved-points");
    let totalPointsElement = document.getElementById("total-points");

    correctWordPointsElement.textContent = correctWordPoints;
    correctFirstLetterPointsElement.textContent = correctFirstLetterPoints;
    solvedPointsElement.textContent = bonusPoints;
    totalPointsElement.textContent = totalPoints;

    //Set the chart data
    let pointArray = stats.metaStats.pointArray;
    if (totalPoints > 0) {
      pointArray[totalPoints - 1] += 1;
      console.log("setting chart data, highlighting:", totalPoints - 1);
      setChartData(chart, pointArray, totalPoints - 1);
    }

    //Show the meta stats
    averageElement.textContent = stats.metaStats.average;
    totalWinsElement.textContent = stats.metaStats.totalWins;
    currentWinStreakElement.textContent = stats.metaStats.currentWinStreak;
    longestWinStreakElement.textContent = stats.metaStats.longestWinStreak;

    //Tabulate and save the final scores
    saveGameStateToLocalStorage();
    if (submitted) writeStatsToLocalStorageOnGameEnd(totalPoints);
  }

  function saveGameStateToLocalStorage() {
    //Saves the current correct guesses to local storage
    //Only Saves the guesses today
    //Todays date will overwrite the previous days
    //Game will also save meta stats that won't be overwritten
    //let date = newDate();

    let stats = readStatsFromLocalStorage();

    //Get all the correctly guessed words and filter
    let correctGuesses = puzzleWords.map((word, i) => {
      if (word.classList.contains("right")) {
        let inputs = word.querySelectorAll("input");
        let guess = [...inputs].map((input) => input.value);
        return [guess, i];
      }
    });
    correctGuesses = correctGuesses.filter((elem) => elem !== undefined);
    //Get all the correctly guessed first letters and filter
    let firstLetterCorrect = puzzleWords.map((word, i) => {
      if (word.classList.contains("first-letter-correct")) {
        let input = word.querySelectorAll("input");
        let value = input[0].value;

        return [i, value];
      }
    });
    firstLetterCorrect = firstLetterCorrect.filter(
      (elem) => elem !== undefined
    );

    if (date.getTime() > stats.todaysPuzzle.date) {
      stats.todaysPuzzle.date = date;
    }

    stats.todaysPuzzle.date = date.getTime();
    stats.todaysPuzzle.answers.correctWords = correctGuesses;
    stats.todaysPuzzle.answers.correctFirstLetters = firstLetterCorrect;
    stats.todaysPuzzle.lives = lives;

    writeGameStateToLocalStorage(stats);
  }

  function writeStatsToLocalStorageOnGameEnd(totalPoints) {
    let stats = readStatsFromLocalStorage();

    //Get the last win date
    let lastWinDate = stats.metaStats.lastWinDate;
    let currentDate = date.getTime();

    let gameScore = totalPoints;

    stats.metaStats.average = parseFloat(stats.metaStats.average);
    stats.metaStats.gameCount = parseInt(stats.metaStats.gameCount);
    stats.metaStats.currentWinStreak = parseInt(
      stats.metaStats.currentWinStreak
    );
    stats.metaStats.longestWinStreak = parseInt(
      stats.metaStats.longestWinStreak
    );

    stats.metaStats.totalWins = parseInt(stats.metaStats.totalWins);
    stats.metaStats.totalWins += 1;

    //calculate the new average
    let newAverage =
      (stats.metaStats.average * stats.metaStats.gameCount + gameScore) /
      (stats.metaStats.gameCount + 1);
    stats.metaStats.average = newAverage;
    stats.metaStats.gameCount += 1;

    //Calculate the new win streak
    if (
      gameScore == 15 &&
      (stats.metaStats.currentWinStreak == 0 ||
        (currentDate - lastWinDate) / (1000 * 60 * 60 * 24) == 1)
    ) {
      stats.metaStats.currentWinStreak += 1;
      if (stats.metaStats.currentWinStreak > stats.metaStats.longestWinStreak) {
        stats.metaStats.longestWinStreak = stats.metaStats.currentWinStreak;
      }
    } else {
      stats.metaStats.currentWinStreak = 0;
    }

    //Save the last win date
    stats.metaStats.lastWinDate = currentDate;

    //save point array
    let pointArray = stats.metaStats.pointArray;
    pointArray[gameScore - 1] += 1;
    stats.metaStats.pointArray = pointArray;

    window.localStorage.setItem("stats", JSON.stringify(stats));
    setChartData(chart, pointArray, gameScore - 1);

    //Handle Chart
    let totalWinsElement = document.getElementById("total-wins");
    let averageElement = document.getElementById("average");
    let currentWinStreakElement = document.getElementById("current-win-streak");
    let longestWinStreakElement = document.getElementById("longest-win-streak");

    totalWinsElement.textContent = stats.metaStats.totalWins;
    averageElement.textContent = stats.metaStats.average;
    currentWinStreakElement.textContent = stats.metaStats.currentWinStreak;
    longestWinStreakElement.textContent = stats.metaStats.longestWinStreak;
  }

  function writeGameStateToLocalStorage(stats) {
    window.localStorage.setItem("stats", JSON.stringify(stats));
  }

  function readStatsFromLocalStorage() {
    if (window.localStorage.getItem("stats") === null) return null;

    return JSON.parse(window.localStorage.getItem("stats"));
  }

  function loadStats() {
    stats = readStatsFromLocalStorage();

    if (stats === null) {
      stats = generateStats();
      saveGameStateToLocalStorage();
    }

    let date = newDate().getTime();
    let statsDate = stats.todaysPuzzle.date;

    /*

        Loading Todays Puzzle

    */
    //Check TodaysPuzzle Date
    if (statsDate === date) {
      //Handle correct words
      let correctWords = stats.todaysPuzzle.answers.correctWords;
      correctWords.forEach((word) => {
        let wordIndex = word[1];
        let inputs = puzzleWords[wordIndex].querySelectorAll("input");
        let guess = word[0];
        guess.forEach((letter, i) => {
          inputs[i].value = letter;
        });
        markWordCorrect(puzzleWords[wordIndex]);
      });

      //Handle correct first letters
      let correctFirstLetters = stats.todaysPuzzle.answers.correctFirstLetters;
      correctFirstLetters.forEach((letter) => {
        let wordIndex = letter[0];
        let input = puzzleWords[wordIndex].querySelectorAll("input")[0];
        input.value = letter[1];
        markFirstLetterCorrect(puzzleWords[wordIndex]);
      });

      //Handle Lives
      lives = stats.todaysPuzzle.lives;
      //handle lives display and freezing of inputs if lives are 0
      if (lives <= 0 || checkAllCorrect(puzzleWords, false)) {
        endGame(false);
      }

      drawLives();
    }

    /*

        Loading Meta Stats

    */

    //Handle Meta Stats
    let totalWins = stats.metaStats.totalWins;
    let average = stats.metaStats.average;
    let currentWinStreak = stats.metaStats.currentWinStreak;
    let longestWinStreak = stats.metaStats.longestWinStreak;
    let pointArray = stats.metaStats.pointArray;

    //Handle Chart
    let totalWinsElement = document.getElementById("total-wins");
    let averageElement = document.getElementById("average");
    let currentWinStreakElement = document.getElementById("current-win-streak");
    let longestWinStreakElement = document.getElementById("longest-win-streak");

    totalWinsElement.textContent = totalWins;
    averageElement.textContent = average;
    currentWinStreakElement.textContent = currentWinStreak;
    longestWinStreakElement.textContent = longestWinStreak;

    return pointArray;
  }

  function generateStats() {
    //Generate stats for the first time
    /* using this JSON structure
      {
        "todaysPuzzle":
          {
            "date": "1714104000000",
            "answers":{
              "correctWords": [],
              "correctFirstLetters": []
            },
            lives: 3
          },
          "metaStats":{
            "average": "0",
            "gameCount": "0",
            "totalWins": "0",
            "currentWinStreak": "0",
            "lastWinDate": "1714104000000",
            "longestWinStreak": "0",
            "pointArray": []
          }
        }
    */
    let date = newDate();

    let yesterday = new Date(date).getTime();

    let stats = {
      todaysPuzzle: {
        date: yesterday,
        answers: {
          correctWords: [],
          correctFirstLetters: [],
        },
        lives: 3,
      },
      metaStats: {
        average: "0",
        gameCount: "0",
        totalWins: "0",
        currentWinStreak: "0",
        lastWinDate: "0",
        longestWinStreak: "0",
        pointArray: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    };

    window.localStorage.setItem("stats", JSON.stringify(stats));
    return stats;
  }

  function inputKeyData(
    e,
    input,
    inputs,
    inputIndex,
    wordIndex,
    wordDiv,
    hintWord
  ) {
    if (e.key !== "Tab" || !ctrlDown) e.preventDefault();

    if (/^[^a-zA-Z]+$/.test(e.key)) {
      return;
    }

    if (recentInput === null) {
      let firstWord = puzzleWords[0];
      let firstInput = firstWord.querySelector("input");
      firstInput.focus();
    }

    if (e.key.length === 1) {
      input.value = e.key.toLowerCase();
      input.placeholder = "";
      if (inputIndex < inputs.length - 1) {
        moveToNextInput(inputs, inputIndex);
      }
    }

    if (e.key === "Backspace") {
      deleteInputValue(inputs, inputIndex, input, wordIndex);
    }

    if (e.key === "Enter") {
      submitAnswer(wordDiv, hintWord, inputs, wordIndex);
      if (!checkAllCorrect(puzzleWords, false)) {
        moveToNextHintWord(puzzleWords, wordIndex);
        saveGameStateToLocalStorage();
      }
    }

    if (e.key === "ArrowDown") {
      moveToNextHintWord(puzzleWords, wordIndex);
    }

    if (e.key === "ArrowUp") {
      moveToPreviousHintWord(puzzleWords, wordIndex);
    }

    if (e.key === "ArrowLeft") {
      moveToPreviousInput(inputs, inputIndex, wordIndex);
    }

    if (e.key === "ArrowRight") {
      moveToNextInput(inputs, inputIndex);
    }
  }

  function tabulateScores() {
    /*
        Scoring Rules:
        1. 1 point for each correct first letter
        2. 1 point for each correct word
        3. 5 points for solving the acrostic
    */

    let correctWords = puzzleWords.filter((word) => {
      return word.classList.contains("right");
    });
    let correctFirstLetters = puzzleWords.filter((word) => {
      return word.classList.contains("first-letter-correct");
    });

    let correctWordPoints = correctWords.length;
    let correctFirstLetterPoints = correctFirstLetters.length;
    let bonusPoints = correctWords.length == hintWords.length ? 5 : 0;
    let totalPoints =
      correctWordPoints + correctFirstLetterPoints + bonusPoints;

    return {
      correctWordPoints,
      correctFirstLetterPoints,
      bonusPoints,
      totalPoints,
    };
  }

  // Create a div for each word in the puzzle
  // Handle inputs
  function populateInputs(author, title, date, hintWords) {
    let authorElem = document.getElementById("author");
    let titleElem = document.getElementById("title");
    let dateElem = document.getElementById("date");

    authorElem.textContent = author;
    titleElem.textContent = title;
    dateElem.textContent = date.toDateString();

    hintWords.forEach((hintWord, wordIndex) => {
      //Puzzle
      const wordDiv = document.createElement("div");
      wordDiv.classList.add("puzzle-word");
      wordDiv.id;

      const underlineSpan = document.createElement("span");
      underlineSpan.classList.add("underline");
      //Each Input
      const hintSpan = document.createElement("label");
      hintSpan.textContent = ` Hint: ${hintWord.hint}`;
      hintSpan.classList.add("label");
      wordDiv.appendChild(hintSpan);
      wordDiv.appendChild(underlineSpan);

      if (hintWord.word.length > 10) {
        wordDiv.classList.add("long-word");
      }

      const inputs = [];

      // Create an input for each letter in the word
      for (let i = 0; i < hintWord.word.length; i++) {
        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("maxlength", "1");
        input.setAttribute("data-hint", hintWord.hint); // You can use this attribute to show the hint on hover or focus, for example
        input.setAttribute("inputmode", "none");
        underlineSpan.appendChild(input);
        inputs.push(input);
      }

      inputs.forEach((input, inputIndex) => {
        // Move to next input on input
        input.addEventListener("focus", (e) => {
          /* Set Global Variables */
          recentInput = e.target;
          recentInputIndex = inputIndex;
          recentWordIndex = wordIndex;
          recentInputs = inputs;
          recentWordDiv = wordDiv;
          recentHintWord = hintWord;
        });

        // Move to previous input on delete, using keydown to capture before the input event clears the value
        input.addEventListener("keydown", (e) => {
          inputKeyData(
            e,
            input,
            inputs,
            inputIndex,
            wordIndex,
            wordDiv,
            hintWord
          );
        });
      });

      puzzleContainer.appendChild(wordDiv);
      puzzleWords.push(wordDiv);
    });
  }

  //Handle Popups
  function toggleScroll() {
    document.body.classList.toggle("no-scroll");
  }

  helpButton.addEventListener("click", function () {
    helpPopup.classList.toggle("hidden");
    toggleScroll();
  });

  helpContainerClose.addEventListener("click", function () {
    helpPopup.classList.toggle("hidden");
    toggleScroll();
  });

  //Stats
  statsButton.addEventListener("click", function () {
    statsPopup.classList.remove("hidden");
    toggleScroll();
  });
  statsContainerClose.addEventListener("click", function () {
    statsPopup.classList.add("hidden");
    toggleScroll();
  });

  //Settings
  /*
  let settingsButton = document.getElementById("settings-button");  
  settingsButton.addEventListener("click", function () {
    settingsPopup.classList.toggle("hidden");
    toggleScroll();
  });
  settingsContainerClose.addEventListener("click", function () {
    settingsPopup.classList.toggle("hidden");
    toggleScroll();
  });
*/

  //Virtual Keyboard
  keyboard.addEventListener("keyClick", function (event) {
    //log the key that was clicked
    event.preventDefault();
    let key = event.detail;
    // input key into the most recently focused input
    if (recentInput === null) {
      //focus the first input in the first word
      let firstWord = puzzleWords[0];
      let firstInput = firstWord.querySelector("input");
      firstInput.focus();
    }
    if (recentInput.disabled) return;
    if (recentInput) {
      if (key !== "delete" && key !== "enter") {
        recentInput.value = key;
        recentInput.placeholder = "";
        let inputs = recentInput.parentNode.querySelectorAll("input");
        let inputIndex = [...inputs].indexOf(recentInput);
        if (inputIndex < inputs.length - 1) {
          moveToNextInput(inputs, inputIndex);
        }
      } else if (key === "delete") {
        deleteInputValue(
          recentInputs,
          recentInputIndex,
          recentInput,
          recentWordIndex
        );
      } else if (key === "enter") {
        submitAnswer(
          recentWordDiv,
          recentHintWord,
          recentInputs,
          recentWordIndex
        );
        saveGameStateToLocalStorage();
        moveToNextHintWord(puzzleWords, recentWordIndex);
      }
    }
  });

  setupGame();
});
