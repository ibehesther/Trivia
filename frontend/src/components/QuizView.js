import React, { Component } from 'react';
import $ from 'jquery';
import '../stylesheets/QuizView.css';
import UserForm from './UserForm';

const questionsPerPlay = 5;

class QuizView extends Component {
  constructor(props) {
    super();
    this.state = {
      quizCategory: null,
      previousQuestions: [],
      showAnswer: false,
      categories: {},
      numCorrect: 0,
      currentQuestion: {},
      guess: '',
      forceEnd: false,
      showUserForm: true,
      currentUser: null,
      currentUserScore: 0
    };
  }

  componentDidMount() {
    $.ajax({
      url: `/api/v1.0/categories`, //TODO: update request URL
      type: 'GET',
      success: (result) => {
        this.setState({ categories: result.categories });
        return;
      },
      error: (error) => {
        alert('Unable to load categories. Please try your request again');
        return;
      },
    });
  }

  selectCategory = ({ type, id = 0 }) => {
    this.setState({ quizCategory: { type, id } }, this.getNextQuestion);
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  getNextQuestion = () => {
    const previousQuestions = [...this.state.previousQuestions];
    if (this.state.currentQuestion.id) {
      previousQuestions.push(this.state.currentQuestion.id);
    }

    $.ajax({
      url: '/api/v1.0/quizzes', //TODO: update request URL
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({
        previous_questions: previousQuestions,
        quiz_category: this.state.quizCategory.type,
      }),
      xhrFields: {
        withCredentials: true,
      },
      crossDomain: true,
      success: (result) => {
        this.setState({
          showAnswer: false,
          previousQuestions: previousQuestions,
          currentQuestion: result.question,
          guess: '',
          forceEnd: result.question ? false : true,
        });
        return;
      },
      error: (error) => {
        alert('Unable to load question. Please try your request again');
        return;
      },
    });
  };

  submitGuess = (event) => {
    event.preventDefault();
    let evaluate = this.evaluateAnswer();
    this.setState({
      numCorrect: !evaluate ? this.state.numCorrect : this.state.numCorrect + 1,
      showAnswer: true,
    });
  };
  restartGame = () => {
    this.setState({
      quizCategory: null,
      previousQuestions: [],
      showAnswer: false,
      numCorrect: 0,
      currentQuestion: {},
      guess: '',
      forceEnd: false,
    });
  };

  renderPrePlay() {
    return (
      <div className='quiz-play-holder'>
        <div className='choose-header'>Choose Category</div>
        <div className='category-holder'>
          <div className='play-category' onClick={()=> this.selectCategory({type:'All'})}>
            ALL
          </div>
          {Object.keys(this.state.categories).map((id) => {
            return (
              <div
                key={id}
                value={id}
                className='play-category'
                onClick={() =>
                  this.selectCategory({ type: this.state.categories[id], id })
                }
              >
                {this.state.categories[id]}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  renderFinalScore() {
    return (
      <div className='quiz-play-holder'>
        <div className='final-header'>
          Your Final Score is {this.state.numCorrect}
        </div>
        <div className='play-again button' onClick={this.restartGame}>
          Play Again?
        </div>
      </div>
    );
  }
  updateUserScore = () => {
    $.ajax({
      url: '/api/v1.0/users',
      type: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({
        id: this.state.currentUser,
        name: this.state.user_name,
        score: this.state.numCorrect
      }),
      xhrFields: {
        withCredentials: true,
      },
      crossDomain: true,
    })
    return this.renderFinalScore();
  }
  evaluateAnswer = () => {
    const formatGuess = this.state.guess
      // eslint-disable-next-line
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .toLowerCase();
    const answerArray = this.state.currentQuestion.answer
      .toLowerCase()
      .split(' ');
    return answerArray.every((el) => formatGuess.includes(el));
  };

  renderCorrectAnswer() {
    let evaluate = this.evaluateAnswer();
    return (
      <div className='quiz-play-holder'>
        <div className='quiz-question'>
          {this.state.currentQuestion.question}
        </div>
        <div className={`${evaluate ? 'correct' : 'wrong'}`}>
          {evaluate ? 'You were correct!' : 'You were incorrect'}
        </div>
        <div className='quiz-answer'>{this.state.currentQuestion.answer}</div>
        <div className='next-question button' onClick={this.getNextQuestion}>
          {' '}
          Next Question{' '}
        </div>
      </div>
    );
  }

  renderPlay() {
    return this.state.previousQuestions.length === questionsPerPlay ||
      this.state.forceEnd ? (
      // this.renderFinalScore()
      this.updateUserScore()
    ) : this.state.showAnswer ? (
      this.renderCorrectAnswer()
    ) : (
      <div className='quiz-play-holder'>
        <div className='quiz-question'>
          {this.state.currentQuestion.question}
        </div>
        <form onSubmit={this.submitGuess}>
          <input type='text' name='guess' onChange={this.handleChange} />
          <input
            className='submit-guess button'
            type='submit'
            value='Submit Answer'
          />
        </form>
      </div>
    );
  }
  addUser =(e) => {
    e.preventDefault()
    $.ajax({
      url :'/api/v1.0/users',
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({
       name: this.state.user_name,
       score: this.state.numCorrect
      }),
      crossDomain: true,
      success: (result) => {
        let user = result.user
        this.setState({
          currentUser: user.id,
          user_name: user.name,
          currentUsercore: this.state.numCorrect,
          showUserForm : false
        })
      }
    });
    
  }
  render() {
    return( 
      <div>
        {this.state.user_name?<p>Now Playing : {this.state.user_name}</p>: null}
        
        {this.state.showUserForm? 
        <UserForm onSubmit= {this.addUser} onHandleChange = {this.handleChange}/>
        :
        <div></div>}
        {this.state.quizCategory ? this.renderPlay() : this.renderPrePlay()}
      </div>
      
      ) 
  }
}

export default QuizView;
