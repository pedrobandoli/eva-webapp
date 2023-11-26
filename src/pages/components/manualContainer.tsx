import React, { useCallback, useEffect, useState } from "react";
import { Quiz } from "../types";
import { DisplayQuestions } from "./displayQuestions";
import { Options } from "./options";

export const ManualContainer = ({ open }: { open: boolean }) => {
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const [options, setOptions] = useState({
    amount: 1,
    random: false,
    exact: false,
  });

  const memoizedHandleSetOption = useCallback(
    (type: "amount" | "random" | "exact", value: any) => {
      setOptions((prevOptions) => ({ ...prevOptions, [type]: value }));
    },
    [{ ...options }]
  );

  const RenderComponent = () => {
    let component: React.ReactElement = <></>;

    if (!creatingQuiz)
      component = (
        <div className="options-wrapper">
          <Options
            options={options}
            memoizedHandleSetOption={memoizedHandleSetOption}
          />
          <button className="button-cs default" onClick={() => setCreatingQuiz(true)}>Confirmar</button>
        </div>
      );
    else component = <CreateQuiz options={options} onCancel={() => setCreatingQuiz(false)} />;

    return (
      <div className={`manual-container ${!open ? "hidden" : ""}`}>
        {component}
      </div>
    );
  };

  return <RenderComponent />;
};

const QuestionContainer = ({ index, amount, appendQuestion }: { index: number, amount: number, appendQuestion: (q: string, a: string) => void}) => {
    const [currentQuestion, setCurrentQuestion] = useState<undefined | string>(
      undefined
    );
    const [currentAnswer, setCurrentAnswer] = useState<undefined | string>(undefined);

    const handleClickNext = () => {
      appendQuestion(currentQuestion as string, currentAnswer as string);
      clear();
    }

    const clear = () => {
      setCurrentAnswer(undefined)
      setCurrentAnswer(undefined);
    }
    
    return <div className="question-container">
      <span className="title"> Pergunta nº {index + 1} / {amount} </span>
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
        <button onClick={clear} className="button-cs clear">Limpar</button>
        <button disabled={!currentAnswer || !currentQuestion} onClick={handleClickNext} className="button-cs default"> Próxima </button> 
      </div>    
    </div>;
}

const CreateQuiz = ({options, onCancel}: { options: any, onCancel: () => void}) => {

  const { amount, random, exact }: {
  amount: number;
  random: boolean;
  exact: boolean;
} = options;

  const [tempQuiz, setTempQuiz] = useState<Quiz | {}>({});
  const [index, setIndex] = useState(0);

  const handleClickNext = (currentQuestion: string, currentAnswer: string) => {
    setTempQuiz({
      ...tempQuiz,
      [index]: { question: currentQuestion, answer: currentAnswer },
    });
    setIndex((prev) => prev + 1);
  };

  const RenderComponent = () => {
    const filled = (amount === Object.keys(tempQuiz).length);
    if (!filled) return <><QuestionContainer index={index} amount={amount} appendQuestion={handleClickNext}/>
      <button className="button-cs danger on-footer" onClick={onCancel}> Cancelar</button>
    </>
    return <DisplayQuestions quiz={tempQuiz} onCancel={onCancel}/>
  }

  return <RenderComponent/>
};
