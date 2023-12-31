import './homepage.css';
import './header.css';
import robot from '../../assets/robot.svg';
import React, { Component, ReactElement, useEffect, useState } from 'react';
import axios from 'axios';
import { downloadFile } from '../../utils/b64decoder';
import { createQuizXML } from '../../utils/quizTemplate';

function Header(): any {
    return <div className='custom-header'>
        <div className='logo'>
            <img src={robot}/>
            <span> EvaScript</span>
        </div>
        <div className='links'>
            <span>About</span>
        </div>
    </div>
}


interface QA {
    question: string;
    answer: string;
}


type ContainerTypes = 'inicial' | 'quiz';
type Quiz = { idAnswer: QA }

function Container() {

    const initialState = {
        inicial: { visible: false},
        quiz: {visible: false}
    }

    const [containerVisible, setContainerVisible] = useState<any>({...initialState, inicial: { visible: true}})

    const handleContainers = (type: ContainerTypes) => {
        setContainerVisible({...initialState, [type]: { visible: true}})
    }
    
    return <div>
        <InitialContainer handleContainers={handleContainers} visible={containerVisible.inicial.visible}/>
        <QuizContainer handleContainers={handleContainers} visible={containerVisible.quiz.visible}/>
    </div>
}


function InitialContainer({ handleContainers, visible }: { handleContainers: (type: ContainerTypes) => void, visible: boolean}){
    return visible? (<>
        <span className='title'> Que tipo de script você deseja gerar? </span>
        <p onClick={() => handleContainers('quiz')}> Perguntas e respostas! </p>
        <p onClick={() => {}}> JSON Eva </p>
    </>) : <></>;
}


function QuizContainer({ visible, handleContainers }: { visible: boolean, handleContainers: (type: ContainerTypes) => void }) {

    const [mode, setMode] = useState<'text' | 'sheet' | 'manual' | undefined>(undefined);
    
    const TextContainer = () => {

        const [text, setText] = useState('')
        const maximumSize = 2048;

        return <div className='text-container'>
            <textarea value={text} onChange={(v) => setText(v.target.value)}/>
            <div>
                <button className='rollback' onClick={() => setText('')}> Limpar </button>
                <button className='primary' disabled={text === undefined || text === ''}> Gerar Evaml </button>
            </div>
        </div>
    }

    const SheetContainer = () => {

        const [file, setFile] = useState<Blob | undefined>(undefined);

        const handleChangeFile = (v: any) => {
            const file = (v?.target?.files as unknown as [any])[0]
            setFile(file)
        }

        return <div className='sheet-container'>
            <div className='upload-container'>
                <label htmlFor='sheet-upload'> Selecione o arquivo </label>
                <input id='sheet-upload' type='file' accept='.xlsx' onChange={handleChangeFile} onClick={(ev) => {
                    (ev.target as any).value = ''
                }} />
            </div>

            <div>
                <button className='rollback' onClick={() => setFile(undefined)}> Limpar </button>
                <button className='primary' disabled={file === undefined}> Gerar Evaml {file? `(${(file as any).name})` : ''} </button>
            </div>
        </div>
    }

    const ManualContainer = () => {

        const [quiz, setQuiz] = useState<Quiz | {}>({})
        const [amount, setAmount] = useState(1);
        const [creatingQuiz, setCreatingQuiz] = useState(false);
        const values = new Array(100).fill('_').map((_, i) => i+1)

        const SelectAmount = () => {
            return <div className='select-amount'>
                <span> Primeiro, selecione a quantidade de perguntas desejada. </span>
                <select onChange={(v) => setAmount(parseInt(v.target.value))} value={amount}>
                    {values.map((v) => <option key={`_${v}`} value={v}>{v}</option>)}
                </select>   
                <button className='primary' onClick={() => setCreatingQuiz(true)}>Confirmar</button>             
            </div>
        }

        const DisplayQuestions = ({ quiz }: { quiz: any}) => {

            const [quizCpy, setQuizCpy] = useState({...quiz});
            const [editingQuestion, setEditingQuestion] = useState<undefined | number>();
            const [updatedQA, setUpdatedQA] = useState<{question: string, answer: string}>({
                question: '',
                answer: '',
            })

            const handleUpdateQuiz = () => {
                const id = editingQuestion as number;
                quizCpy[id] = {question: updatedQA.question || quiz[id].question, answer: updatedQA.answer || quiz[id].answer}
                setUpdatedQA({ question: '', answer: ''})
                setQuizCpy({...quizCpy})
                setEditingQuestion(undefined);
            }


            return <>{Object.entries(quizCpy).map(([id, qa]) => 
                <div className='qa-container'>
                    <span className='qa-id'> Pergunta {id + 1} | <a onClick={() => setEditingQuestion(parseInt(id))}> Alterar</a> </span>
                    <div className='qa-description'>
                        {!(editingQuestion as number === parseInt(id)) ? (<><span className='question'> {(qa as any).question}</span>
                        <span className='pre-answer'>
                            R: <span className='answer'> {(qa as any).answer} </span>
                            </span></>): <>
                                <div className='new-qa'>
                                    <span> Nova pergunta: </span>
                                    <input value={updatedQA?.question} placeholder={(qa as any).question} onChange={(v) => setUpdatedQA({...updatedQA, question: v.target.value})}/>
                                </div>
                                <div className='new-qa'>
                                    <span> Nova resposta: </span>
                                    <input value={updatedQA?.answer} placeholder={(qa as any).answer} onChange={(v) => setUpdatedQA({...updatedQA, answer: v.target.value})}/>
                                </div>
                                <div className='buttons'>
                                    <button className='primary' onClick={handleUpdateQuiz}> Ok </button>
                                    <button className='rollback'> Limpar </button>
                                </div>
                            </>
        }
                    </div>
                </div>
            )}
            <div className='submit-button'>
                <button className='primary' onClick={() => console.log(quizCpy)}>
                    Gerar XML!
                </button>
            </div>
            </>
        }


        const CreateQuiz = ({ amount }: {amount : number}) => {
            const [tempQuiz, setTempQuiz] = useState<Quiz | {}>({});
            const [index, setIndex] = useState(0);
            const [currentAnswer, setCurrentAnswer] = useState<undefined | string>(undefined);
            const [currentQuestion, setCurrentQuestion] = useState<undefined | string>(undefined);

            const handleClickNext = () => {
                setTempQuiz({...tempQuiz, [index]: {question: currentQuestion, answer: currentAnswer}})
                setCurrentQuestion(undefined);
                setCurrentAnswer(undefined);
                setIndex((prev) => prev + 1)
            }
             
            useEffect(() => {
                console.log(quiz, amount, Object.keys(tempQuiz).length);
                console.log(amount === Object.keys(tempQuiz).length)
            }, [tempQuiz, amount])

            return !(amount === Object.keys(tempQuiz).length) ? (<div className='create-quiz'>
                <span> Pergunta nº {index + 1} / {amount}</span>
                <div>
                    <input value={currentQuestion || ''} placeholder='Insira a pergunta' onChange={(v) => setCurrentQuestion(v.target.value)}/>
                    <input value={currentAnswer || ''} placeholder='Insira a resposta' onChange={(v) => setCurrentAnswer(v.target.value)}/>
                </div>
                <button className='primary' onClick={handleClickNext} disabled={!currentAnswer || !currentQuestion}> Próxima </button>
            </div>): <DisplayQuestions quiz={tempQuiz}/>
        }

        return <div className='manual-container'>
            {!creatingQuiz? <SelectAmount/>: <CreateQuiz amount={amount}/>}
        </div>
    }

    return visible? <>
        <span className='title'> Como você deseja gerar? </span>
        <div className='actions'>
            <button onClick={() => setMode('text')}>
                A partir de um texto
            </button>
            <div className={`action-container ${mode === 'text'? 'open': ''}`}>
                <TextContainer/>
            </div>
            <button onClick={() => setMode('sheet')}>
                A partir de um planilha (Consulte o modelo)
            </button>
            <div className={`action-container ${mode === 'sheet' ? 'open' : ''}`}>
                <SheetContainer/>
            </div>
            <button onClick={() => setMode('manual')}>
                Adicionar perguntas e respostas manualmente
            </button>
            <div className={`action-container ${mode === 'manual' ? 'open' : ''}`}>
                <ManualContainer/>
            </div>
        </div>
       </>: null;
       

}

export default function Homepage(): any {
    return (<div> 
        <Header/>
        <div className='homepage-body'>
            <Container/>
        </div>
    </div>)
}