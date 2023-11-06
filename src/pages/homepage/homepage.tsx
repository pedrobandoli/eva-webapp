import './homepage.css';
import { ReactComponent as Logo } from '../../assets/logo.svg';
import React, { Component, useEffect, useState } from 'react';
import axios from 'axios';
import { downloadFile } from '../../utils/b64decoder';

function Header(): any {
    return <header>
        <Logo/>
    </header>
}


function Quiz({ quantidade }: any) {

    const [state, setState] = useState({
        currentQuestion: undefined,
        currentAnswer: undefined,
        qid: 1,
        questionario: {},
        filled: false,
    })

    useEffect(() => {
        console.log(state.questionario)}, [state])

    const addToQuestionary = () => {
        setState({...state, currentAnswer: undefined, currentQuestion: undefined, qid: state.qid + 1, 
            questionario: {...state.questionario, [`pergunta${state.qid}`]: {[state.currentQuestion as unknown as string]: state.currentAnswer}},
            filled: Object.keys(state.questionario).length + 1 === quantidade,
        })
    }

    function QuestionaryDisplay() {
        const [changeKey, setChangeKey] = useState<string|undefined>(undefined);
        const [newAnswer, setNewAnswer] = useState();
        const [newQuestion, setNewQuestion] = useState();

        return <div className='main-questionary-display'>
            <div className='questionary-display'>{
            Object.entries(state.questionario).map(([idPergunta, qa], index) => {
            return Object.entries(qa as any).map(([pergunta, resposta]) => {
                return <div key={index}>
                <div className='question' onClick={() => setChangeKey(idPergunta)}>
                    <span> Pergunta {index + 1}:</span> 
                    {changeKey === idPergunta? 
                        <input placeholder={pergunta} value={newQuestion || ''} onChange={(e) => setNewQuestion(e.target.value as any)}/>
                        : <span> {pergunta}</span>}
                </div>
                <div className='question'>
                <span> Resposta: </span> {changeKey === idPergunta? 
                        <input value={newAnswer || ''} placeholder={resposta as string} onChange={(e) => setNewAnswer(e.target.value as any)}/>
                        : <span> {resposta as string}</span>}
                </div>
                {changeKey && changeKey===idPergunta? <button disabled={!newAnswer && !newQuestion} onClick={() => {
                    const question = newQuestion || pergunta;
                    const answer = newAnswer || resposta;
                    
                    const novoQuestionario = {...state.questionario, [idPergunta]: {[question as unknown as string]: answer}}

                    setState({...state, questionario: {...novoQuestionario}})}
                
                }>OK!</button>: null}
            </div>
            })
        })}
        </div>
        <button>Gerar script EvaML</button>
        </div>
    }


    return <div className='create-quiz'>
        {!state.filled? (<div className='quiz-container'>
        <span> Pergunta {state.qid} de {quantidade}</span>
        <input value={state.currentQuestion || ''} 
            placeholder='Qual a pergunta?'
            onChange={(e) => setState({...state, currentQuestion: e.target.value as any})}/>
        <input value={state.currentAnswer || ''} 
            placeholder='Qual a resposta?'
            onChange={(e) => setState({...state, currentAnswer: e.target.value as any})}/>
        <button
            onClick={() => addToQuestionary()} 
            disabled={!state.currentAnswer || !state.currentQuestion}>
            Confirmar e ir para a próxima!
        </button>
    </div>): <QuestionaryDisplay/>}
    </div>
}

function Body() {

    const [state, setState] = useState<
        { tema?: 'historia'| 'geografia' | 'quimica' | 'fisica',
          nivel?: 'fundamental' | 'medio',
          quantidade: number | null}>({
        tema: undefined,
        nivel: undefined,
        quantidade: null,
    })

    const [quiz, setQuiz] = useState(false);


    const handleAmountChange  = (event: any) => {
        const inputValue = event.target.value;
    
        if (/^[1-9]\d*$/.test(inputValue)) {
            setState({...state, quantidade: parseInt(event.target.value)})
        } else if (!inputValue) setState({...state, quantidade: null})
    }

    return <div className='container'>
        {!quiz? <div className='create-quiz'>
            <div className='game-form'>

                <select onChange={(e) => setState({...state, tema: e.target.value as any})}
                        value={state.tema || ''}
                    >
                    <option value='' disabled hidden> Escolha o tema </option>
                    <option value='historia'> História </option>
                    <option value='geografia'> Geografia </option>
                    <option value='matematica'> Matemática </option>

                </select>

                <select 
                    onChange={(e) => setState({...state, nivel: e.target.value as any})}
                    value={state.nivel || ''}
                    >
                    <option value='' disabled hidden> Escolha o nível da turma</option>
                    <option value='fundamental'> Fundamental </option>
                    <option value='médio'> Médio </option>
                </select>
                <input placeholder='Insira o número de perguntas'
                    value={state.quantidade || ''}
                    onChange={(e) => handleAmountChange(e)}/>
            </div>
            <button onClick={() => setQuiz(true)} disabled={!state.quantidade}>
                Gerar Quiz
            </button>
           <FileUpload/>
        </div>: <Quiz quantidade={state.quantidade}/>}
    </div>
}

function FileUpload(){

    const [file, setFile] = useState();
    const [correctType, setCorrectType] = useState(false);

    const uploadFile = async () => {

        const formData = new FormData();
        formData.append('file', file as unknown as Blob, (file as any).name)
        const { data } = await axios.post('/api/create-xml', formData);
        downloadFile('application/xml', data, (file as any).name)
    }

    const handleChangeFile = (event: any) => {
        const file = event.target.files[0];
        setFile(file)
        setCorrectType((file as any).name.split('.')[1] === 'xml')
    }

    return <div>
            <input type='file' onChange={(e) => handleChangeFile(e)}/>
            <button onClick={() => uploadFile()} disabled={!correctType}> XML -{'>'} EVAML </button>
        </div>

}


export default function Homepage(): any {
    return (<div> 
        <Header/>
        <Body/>
    </div>)
}