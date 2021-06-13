// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
//var KahootClient = require('./kahoot-client.js');
//let client = new KahootClient();
let client = require('./classes/kahoot-client.js');

window.addEventListener('DOMContentLoaded', async () => {
  let PIN, NAME;

  // On index page.
  if (document.getElementsByClassName('index')[0]) {

    var form = document.getElementById('submitGameCode') /*Your Form Element*/ ;
    var submitBtnPin = document.getElementById('submitBtnPin');
    var ele = document.getElementsByClassName("inputPin")[0];

    form.onsubmit = (e) => {
      e.preventDefault();
    }

    submitBtnPin.onclick = async () => {
      let formData = new FormData(form);
      for (var key of formData.entries()) {
        if (key[0] == "code") {
          PIN = key[1];
          if (PIN == "") return ele.classList.add('error');
          if (isNaN(PIN)) {
            return ele.classList.add('error');
          }
          let pinTrue = false;
          document.getElementById("loader").classList.add("loading")
          pinTrue = await client.validatePIN(PIN);
          document.getElementById("loader").classList.remove("loading")
          if (!pinTrue) {
            ele.classList.add('error');
          } else {
            submitBtnPin.setAttribute("id", "submitBtnName");
            var submitBtnName = document.getElementById('submitBtnName');
            ele.setAttribute("name", "name");
            ele.setAttribute("maxlength", "15")
            ele.setAttribute("placeholder", "Enter A Nickname");
            submitBtnName.innerText = "Ok, GO!";
            ele.value = "";
          }
        } else if (key[0] == "name") {
          NAME = key[1];
          if (NAME == "") {
            return ele.classList.add('error');
          }
          if (NAME.length > 15) return ele.classList.add('error');

          document.getElementById("loader").classList.add("loading")
          clientJoined = await client.join(PIN, NAME);
          document.getElementById("loader").classList.remove("loading")
          if (clientJoined == !true) {
            // Joined Success
            client.on('NameAccept', (Obj) => {
              client.updateName(Obj.playerName);
              document.getElementById('wrapper').style.display = "none";
              let NC = require('./pages/quiz/instructions-page')(Obj.playerName);
              document.getElementById('loader').classList.remove('index');
              document.getElementById('loader').classList.add('instructions');
              document.getElementById('wrapper-2').innerHTML = NC;
              client.on('Disconnect', Disconnect);
              client.on('QuestionEnd', QuestionEnd);
              client.on('QuestionReady', QuestionReady);
              client.on('QuestionStart', QuestionStart);
              client.on('QuizEnd', QuizEnd);
              client.on('QuizStart', QuizStart);
              client.on('TimeOver', TimeOver);

              // Now this parent if statement will return false.
            });

          } else {
            console.log(clientJoined)
            // <div class="errorMessageDiv"><div class="innerErrorMessage"><i class="far fa-exclamation-circle errorMessageIcon"></i><div class="errorMessage"></div></div></div>
            errorMessage(clientJoined);
          }
        }
      }
    }
  }

  // Events for client.
  function QuizStart(quiz) {
    client.joinedBeforeQuizStarts = true;
    document.getElementById('wrapper').style.display = "none";
    let NC = require('./pages/quiz/quizLoading-page')(client.playerName);
    document.getElementById('loader').classList.add('game');
    document.getElementById('loader').classList.remove('instructions');
    document.getElementById('wrapper-2').innerHTML = NC;
  }

  function TimeOver(Obj) {
    // Nothing to do here
  }

  function QuizEnd(Obj) {
    // Things to do here...
  }

  function QuestionStart(Obj) {
    // Things to do here...
    if (!client.joinedBeforeQuizStarts) {
      // This means that things are not initialized properly, so we initialize them.
      document.getElementById('wrapper').style.display = "none";
      let NC = require('./pages/quiz/quizLoading-page')(client.playerName);
      document.getElementById('loader').classList.add('game');
      document.getElementById('loader').classList.remove('instructions');
      document.getElementById('wrapper-2').innerHTML = NC;
      client.joinedBeforeQuizStarts = true;
    }

    if (!Obj.gameBlockType.includes("quiz") && !Obj.gameBlockType.includes("poll")) return;

    let NC;

    if (Obj.gameBlockType.includes("multiple")) {
      if (Obj.gameBlockType.includes("quiz")) {
        // Quiz handler Multiple select only 4 possible buttons with the on form submit event.
      } else if (Obj.gameBlockType.includes("poll")) {
        // Poll Handler Multiple select with the on form submit event.
      }
    } else {
      if (Obj.gameBlockType.includes("quiz")) {
        // Quiz number of choices functions with the onclick event.
        if (Obj.quizQuestionAnswers[Obj.questionIndex] == 2) {
          NC = require('./pages/question/questionSingle-page')(Obj, client, true)
          document.getElementById('wrapper-2').innerHTML = NC;
          /* onclick s including if is set auto answer and is set quiz id, 
          automatically call onclick with client.answer. 
          if (!client.answer) return and make the user himself select the answer. */
        } else {
          NC = require('./pages/question/questionSingle-page')(Obj, client, false)
          document.getElementById('wrapper-2').innerHTML = NC;
          // onclick s
        }
      } else if (Obj.gameBlockType.includes("poll")) {
        // Poll Handler with the onclick event.
      }
    }
    // let NC = require('./questionSingle-page')(Obj, client, is2)

  }

  function QuestionEnd(Obj) {
    // Things to do here...
    if (!client.joinedBeforeQuizStarts) {
      // This means that things are not initialized properly, so we initialize them.
      document.getElementById('wrapper').style.display = "none";
      let NC = require('./pages/quiz/quizLoading-page')(client.playerName);
      document.getElementById('loader').classList.add('game');
      document.getElementById('loader').classList.remove('instructions');
      document.getElementById('wrapper-2').innerHTML = NC;
      client.joinedBeforeQuizStarts = true;
    }

    if (!client.quizQuestionAnswers) return;

    let NC = require('./pages/question/questionEnd-page')(Obj, client);
    client.totalScore = Obj.totalScore;
    document.getElementById('wrapper-2').innerHTML = NC;
  }

  function QuestionReady(Obj) {
    // Things to do here...
    if (!client.joinedBeforeQuizStarts) {
      // This means that things are not initialized properly, so we initialize them.
      document.getElementById('wrapper').style.display = "none";
      let NC = require('./pages/quiz/quizLoading-page')(client.playerName);
      document.getElementById('loader').classList.add('game');
      document.getElementById('loader').classList.remove('instructions');
      document.getElementById('wrapper-2').innerHTML = NC;
      client.joinedBeforeQuizStarts = true;
    }

    // Now we are good to go.
    if (!Obj.gameBlockType.includes("quiz") && !Obj.gameBlockType.includes("poll")) {
      client.totalScore = Obj.totalScore;
      let NC = require('./pages/question/questionPre-page')(client.playerName, client.totalScore, Obj.questionIndex, Obj.quizQuestionAnswers.length, client.Qname, {
        customText: "NOT_QUIZ"
      });
      document.getElementById('wrapper-2').innerHTML = NC;
    } else {
      let NC = require('./pages/question/questionPre-page')(client.playerName, client.totalScore, Obj.questionIndex, Obj.quizQuestionAnswers.length, client.Qname, {
        customText: "NORMAL"
      });
      document.getElementById('wrapper-2').innerHTML = NC;
      client.quizQuestionAnswers = Obj.quizQuestionAnswers;

      // if is set auto answer and is set quiz id, set client.answer with the answer.
    }
  }

  function Disconnect(reason) {
    //Disconnected
    var ele = document.getElementsByClassName("inputPin")[0];
    document.getElementById('wrapper').style.display = "flex";
    document.getElementById('wrapper-2').innerHTML = "";
    document.getElementById('loader').classList.add('index');
    document.getElementById('loader').classList.remove('instructions');
    document.getElementById('loader').classList.remove('game');
    for (const e of document.getElementsByTagName('link')) {
      if (e.getAttribute('href').includes("instructions.css")) {
        e.remove();
      }
    }
    var submitBtnName = document.getElementById('submitBtnName');
    submitBtnName.setAttribute("id", "submitBtnPin");
    var submitBtnPin = document.getElementById('submitBtnPin');
    ele.setAttribute("name", "code");
    ele.removeAttribute("maxlength")
    ele.setAttribute("placeholder", "Enter Code");
    submitBtnPin.innerText = "Enter";
    ele.value = "";
    errorMessage(`Disconnected: ${reason}`)
  }

  function errorMessage(error) {
    let errorMessageDiv = document.createElement('div');
    errorMessageDiv.setAttribute('class', 'errorMessageDiv');
    let innerErrorMessage = document.createElement('div');
    innerErrorMessage.setAttribute('class', 'innerErrorMessage');
    let iconA = document.createElement('i');
    iconA.setAttribute('class', 'fa fa-2x fa-exclamation-circle errorMessageIcon')
    innerErrorMessage.appendChild(iconA);
    let errorMessage = document.createElement('div');
    errorMessage.setAttribute('class', 'errorMessage');
    errorMessage.innerHTML = error;
    errorMessage.style.marginLeft = "0.5rem"
    innerErrorMessage.appendChild(errorMessage);
    errorMessageDiv.appendChild(innerErrorMessage);
    errorMessageDiv.style.transform = "translateY(100%)";
    document.body.append(errorMessageDiv);
    setTimeout(() => errorMessageDiv.style.transform = "translateY(0)", 500);
    setTimeout(() => {
      errorMessageDiv.style.transform = "translateY(100%)";
      //errorMessageDiv.remove();
    }, 5000);
  }
});