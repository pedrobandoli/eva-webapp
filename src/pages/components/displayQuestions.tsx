import React, { useState } from "react";
import axios from "axios";
import { createQuizXML } from "../../utils/quizTemplate";
import { downloadFile } from "../../utils/b64decoder";
import Update from "../../assets/Create.svg";

const DisplayQuestionContainer = ({
  question,
  answer,
  index,
  onClick,
}: {
  question: string;
  answer: string;
  index: number;
  onClick: (v: number) => void;
}) => {
  return (
    <div className="display-question-container">
      <div className="display-question-header">
        <span> Pergunta {index + 1}</span>
        <img src={Update} onClick={() => onClick(index)} />
      </div>
      <span className="question"> {question}</span>
      <div className="answer">
        <span>R:&nbsp;&nbsp;</span>
        <span> {answer}</span>
      </div>
    </div>
  );
};

const UpdateQuestionContainer = ({
  index,
  open,
  question,
  answer,
  handleConfirm,
}: {
  open: boolean;
  question: string;
  answer: string;
  index: number;
  handleConfirm: (q: string, a: string, index: number) => void;
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(question);
  const [currentAnswer, setCurrentAnswer] = useState(answer);

  const clear = () => {
    setCurrentAnswer(answer);
    setCurrentQuestion(question);
  };

  return !open ? (
    <></>
  ) : (
    <div className="question-container">
      <span className="title"> Pergunta nº {index + 1} </span>
      <div className="input-column">
        <input
          value={currentQuestion || ""}
          placeholder="Insira a pergunta"
          onChange={(v) => setCurrentQuestion(v.target.value)}
        />
        <input
          value={currentAnswer || ""}
          placeholder="Insira a resposta"
          onChange={(v) => setCurrentAnswer(v.target.value)}
        />
      </div>
      <div className="button-row">
        <button onClick={clear} className="button-cs clear">
          Limpar
        </button>
        <button
          disabled={!currentAnswer || !currentQuestion}
          onClick={() => handleConfirm(currentQuestion, currentAnswer, index)}
          className="button-cs default"
        >Confirmar</button>
      </div>
    </div>
  );
};

export const DisplayQuestions = ({ quiz, onCancel }: { quiz: any, onCancel: () => void }) => {
  const [quizCpy, setQuizCpy] = useState({ ...quiz });
  const [editingQuestion, setEditingQuestion] = useState<undefined | number>();

  const handleUpdateQuiz = (question: string, answer: string, id: number) => {
    quizCpy[id] = {
      question: question,
      answer: answer,
    };
    setQuizCpy({ ...quizCpy });
    setEditingQuestion(undefined);
  };

  const handleGenerateScript = async (quizCpy: any) => {
    const xml: string = createQuizXML(quizCpy);
    const filename = `quiz_${new Date().getTime()}`;
    const { data } = await axios.post(`${URL}/api/create-xml`, xml, {
      headers: { "Content-Type": "application/xml" },
    });
    downloadFile("application/xml", data, filename);
  };

  return (
    <div className="manual-container display">
      {Object.entries(quizCpy).map(([id, qa]) => (
        <div className="display-question-container-wrapper">
          <DisplayQuestionContainer
            question={(qa as any).question}
            answer={(qa as any).answer}
            index={parseInt(id)}
            onClick={setEditingQuestion}
          />
          <UpdateQuestionContainer
            open={(editingQuestion as number) === parseInt(id)}
            index={parseInt(id)}
            question={(qa as any).question}
            answer={(qa as any).answer}
            handleConfirm={handleUpdateQuiz}
          />
          <div className="qa-description"></div>
        </div>
      ))}
      <div className="button-column">
        <button
          className="button-cs default"
          onClick={() => handleGenerateScript(quizCpy)}
        >
          Gerar Evaml!
        </button>
        <button
          className="button-cs clear"
          onClick={onCancel}
        >
          Voltar
        </button>
      </div>
    </div>
  );
};
