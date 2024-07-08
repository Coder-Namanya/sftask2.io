// Global variables
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let timeLeft = 30; // Timer in seconds
let timerInterval;
let selectedAnswers = []; // Array to store user's selected answers

async function fetchQuestions() {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=25&type=multiple'); // Fetch 30 questions
        if (!response.ok) {
            throw new Error('Failed to fetch questions.');
        }
        const data = await response.json();
        questions = data.results.map(question => {
            const formattedQuestion = {
                question: question.question,
                options: [...question.incorrect_answers, question.correct_answer],
                answer: question.correct_answer
            };
            // Shuffle options
            formattedQuestion.options = formattedQuestion.options.sort(() => Math.random() - 0.5);
            return formattedQuestion;
        });
        displayQuestion();
    } catch (error) {
        console.error('Error fetching questions:', error);
        document.getElementById('question').textContent = 'Error loading questions. Please try again.';
    }
}

// Display the current question and options
function displayQuestion() {
    if (!questions || questions.length === 0) {
        document.getElementById('question').textContent = 'No questions available. Please try again later.';
        return;
    }

    if (currentQuestionIndex >= questions.length) {
        endQuiz();
        return;
    }

    const question = questions[currentQuestionIndex];
    document.getElementById('question-number').textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;
    document.getElementById('question').innerHTML = question.question;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option');
        button.addEventListener('click', () => selectOption(option));
        optionsContainer.appendChild(button);
    });

    const nextBtn = document.getElementById('next-btn');
    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.textContent = 'Submit';
    } else {
        nextBtn.textContent = 'Next';
    }

    nextBtn.disabled = true;
    document.getElementById('skip-btn').disabled = false; // Enable skip button
    startTimer();
}


// Handle option selection
function selectOption(selectedOption) {
    clearInterval(timerInterval);
    const question = questions[currentQuestionIndex];

    const isCorrect = selectedOption === question.answer;

    selectedAnswers[currentQuestionIndex] = {
        question: question.question,
        selected: selectedOption,
        correct: question.answer
    };

    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.disabled = true;
        if (option.textContent === selectedOption) {
            if (isCorrect) {
                option.classList.add('correct');
                score++;
                updateHighScore(score);
            } else {
                option.classList.add('wrong');
            }
        }
        if (option.textContent === question.answer) {
            option.classList.add('correct');
        }
    });

    document.getElementById('current-score').textContent = score;
    document.getElementById('next-btn').disabled = false;
    document.getElementById('skip-btn').disabled = true;
}

// Move to the next question
document.getElementById('next-btn').addEventListener('click', nextQuestion);

function nextQuestion() {
    clearInterval(timerInterval);
    currentQuestionIndex++;
    displayQuestion();
}

// Start the countdown timer
function startTimer() {
    timeLeft = 30;
    document.getElementById('time').textContent = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up!");
            nextQuestion();
        }
    }, 1000);
}

// End the quiz and display the final score
function endQuiz() {
    updateHighScore(score);

    document.getElementById('quiz').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('final-score').textContent = `Your Score: ${score}/${questions.length}`;

    displayHighScore();

    const answerReviewContainer = document.getElementById('answer-review');
    answerReviewContainer.innerHTML = '';

    questions.forEach((question, index) => {
        const answerReviewItem = document.createElement('div');
        answerReviewItem.innerHTML = `
            <h3>Question ${index + 1}:</h3>
            <p>${question.question}</p>
            <p><strong>Your Answer:</strong> ${selectedAnswers[index] ? selectedAnswers[index].selected : '<span class="skipped">Skipped</span>'}</p>
            <p><strong>Correct Answer:</strong> ${question.answer}</p>
        `;
        answerReviewItem.classList.add('answer-review-item');

        if (selectedAnswers[index] && selectedAnswers[index].selected === question.answer) {
            answerReviewItem.classList.add('correct');
        } else if (!selectedAnswers[index]) {
            answerReviewItem.classList.add('skipped');
        } else {
            answerReviewItem.classList.add('wrong');
        }

        answerReviewContainer.appendChild(answerReviewItem);
    });

    document.getElementById('restart-btn').addEventListener('click', restartQuiz);
}

// Restart the quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    currentScore=0;
    score = 0;
    selectedAnswers = [];
    document.getElementById('quiz').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    fetchQuestions();
}

// Update high score if current score is higher
function updateHighScore(currentScore) {
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem('highScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }
}

// Display high score in the result section
function displayHighScore() {
    const highScoreDisplay = document.createElement('p');
    highScoreDisplay.id = 'high-score';
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    highScoreDisplay.classList.add('high-score');
    document.getElementById('answer-review').insertBefore(highScoreDisplay, document.getElementById('answer-review').firstChild);
}

// Lifeline feature: Skip question
function setupSkipButton() {
    const existingSkipBtn = document.getElementById('skip-btn');
    if (existingSkipBtn) {
        existingSkipBtn.remove();
    }
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skip-btn';
    skipBtn.textContent = 'Skip Question';
    skipBtn.addEventListener('click', skipQuestion);
    document.getElementById('quiz').appendChild(skipBtn);
}

// Skip question function
function skipQuestion() {
    clearInterval(timerInterval);
    selectedAnswers[currentQuestionIndex] = null;
    nextQuestion();
}

// Start the quiz by fetching questions
document.addEventListener('DOMContentLoaded', () => {
    fetchQuestions(); // Initial fetch for 30 questions
    document.getElementById('high-score').textContent = highScore;
    setupSkipButton(); // Call the function to set up the skip button
});
