import "./homepage.css";
import "./header.css";
import "../../main.css";
import robot from "../../assets/robot.svg";
import React, { useState } from "react";
import axios from "axios";
import { downloadFile } from "../../utils/b64decoder";

import Arrow from '../../assets/Vector.svg';
import { DisplayQuestions } from "../components/displayQuestions";
import { ContainerTypes } from "../types";
import { ManualContainer } from "../components/manualContainer";


const URL =
  process.env?.ENV === "production"
    ? "https://pedrobandoli.pythonanywhere.com"
    : "http://127.0.0.1:5000";

function Header(): any {
  return (
    <div className="custom-header">
      <div className="logo">
        <img src={robot} />
        <span> EvaScript</span>
      </div>
      <div className="links">
        <span>About</span>
      </div>
    </div>
  );
}

function Container() {
  const initialState = {
    inicial: { visible: false },
    quiz: { visible: false },
    jsonGen: { visible: false },
  };

  const [containerVisible, setContainerVisible] = useState<any>({
    ...initialState,
    inicial: { visible: true },
  });

  const handleContainers = (type: ContainerTypes) => {
    setContainerVisible({ ...initialState, [type]: { visible: true } });
  };

  return (
    <div>
      <InitialContainer
        handleContainers={handleContainers}
        visible={containerVisible.inicial.visible}
      />
      <QuizContainer
        handleContainers={handleContainers}
        visible={containerVisible.quiz.visible}
      />
      <JsonGenContainer
        handleContainers={handleContainers}
        visible={containerVisible.jsonGen.visible}
      />
    </div>
  );
}

function InitialContainer({
  handleContainers,
  visible,
}: {
  handleContainers: (type: ContainerTypes) => void;
  visible: boolean;
}) {
  return visible ? (
    <div className="container-cs">
      <span> Que tipo de script você deseja gerar? </span>
      <div className="button-row">
        <button
          className="button-cs primary"
          onClick={() => handleContainers("quiz")}
        >
          Perguntas e respostas!
        </button>
        <button
          className="button-cs primary"
          onClick={() => handleContainers("jsonGen")}
        >
          JSON Eva
        </button>
      </div>
    </div>
  ) : (
    <></>
  );
}

function JsonGenContainer({
  handleContainers,
  visible,
}: {
  handleContainers: (type: ContainerTypes) => void;
  visible: boolean;
}) {
  const handleGenerateXml = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file as unknown as Blob, (file as any).name);
    const url = `${URL}/api/create-json-file`;
    const { data } = await axios.post(url, formData);

    downloadFile("application/json", data, (file as any).name);
  };

  return visible ? (
    <>
      <div className="actions">
        <div className={`action-container open`}>
          <FileContainer acceptedType=".xml" onClick={handleGenerateXml} open={true} />
        </div>
      </div>
    </>
  ) : null;
}

const FileContainer = ({
  acceptedType = ".xlsx",
  onClick,
  open,
}: {
  acceptedType?: string;
  onClick?: (file: any) => void;
  open: boolean;
}) => {
  const [file, setFile] = useState<Blob | undefined>(undefined);

  const handleChangeFile = (v: any) => {
    const file = (v?.target?.files as unknown as [any])[0];
    setFile(file);
  };

  return (
    <div className={`sheet-container ${!open? 'hidden': ''}`}>
      <div className="upload-container">
        <label htmlFor="sheet-upload"> Selecione o arquivo </label>
        <input
          id="sheet-upload"
          type="file"
          accept={acceptedType}
          onChange={handleChangeFile}
          onClick={(ev) => {
            (ev.target as any).value = "";
          }}
        />
      </div>

      <div className="button-row">
        <button className="button-cs clear" onClick={() => setFile(undefined)}>
          {" "}
          Limpar{" "}
        </button>
        <button
          className="button-cs default"
          onClick={onClick ? () => onClick(file) : () => {}}
          disabled={file === undefined}
        >
          {" "}
          Gerar Evaml {file ? `(${(file as any).name})` : ""}{" "}
        </button>
      </div>
    </div>
  );
};

function QuizContainer({
  visible,
  handleContainers,
}: {
  visible: boolean;
  handleContainers: (type: ContainerTypes) => void;
}) {
  const [mode, setMode] = useState<"text" | "sheet" | "manual" | undefined>(
    undefined
  );

  

  const TextContainer = ({ open }: { open: boolean }) => {
    const [text, setText] = useState("");
    const [quiz, setQuiz] = useState<any>(undefined);

    const handleGenerateScript = async () => {
      const { data } = await axios.post(
        `${URL}/api/create-quiz-from-text`,
        {
          text,
          amount: 10,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const transformedObj = Object.entries(data).map(([key, value]) => ({
        question: Object.keys(value as any)[0],
        answer: Object.values(value as any)[0],
      }));

      setQuiz(transformedObj);
    };

    return !quiz ? (
      <div className={`text-container ${!open ? "hidden" : ""}`}>
        <textarea value={text} onChange={(v) => setText(v.target.value)} />
        <div className="button-row">
          <button className="button-cs clear" onClick={() => setText("")}>
            Limpar
          </button>
          <button
            className="button-cs default"
            disabled={text === undefined || text === ""}
            onClick={handleGenerateScript}
          >Gerar Q&A
          </button>
        </div>
      </div>
    ) : (
      <div className="manual-container">
        <DisplayQuestions quiz={quiz} onCancel={() => setQuiz(undefined)} />
      </div>
    );
  };

  const handleOpenContainer = (value: 'text' | 'sheet' | 'manual') => {
        if (mode && mode == value) setMode(undefined);
        else setMode(value);
  }


  return visible ? (
    <div className="container-cs">
      <span> Como você deseja gerar? </span>
      <div className={`acordeon-cs ${mode=='text'? 'open': ''}`}>
        <div className="acordeon-title"  onClick={() => handleOpenContainer('text')}>
            <span> A partir de um texto</span>
            <img src={Arrow}/>
        </div>
        <TextContainer open={mode === "text"} />
      </div>
      <div className={`acordeon-cs ${mode=='sheet'? 'open': ''}`}>
        <div className="acordeon-title" onClick={() => handleOpenContainer("sheet")}>
            <span> A partir de uma planilha (Consulte o modelo) </span>
            <img src={Arrow}/>
        </div>
          <FileContainer open={mode === 'sheet'}/>
      </div>
      <div className={`acordeon-cs ${mode=='manual'? 'open': ''}`} >
        <div className="acordeon-title" onClick={() => handleOpenContainer('manual')}>
            <span> Adicionar perguntas e respostas manualmente </span>
            <img src={Arrow}/>
        </div>
          <ManualContainer open={mode ==='manual'} />
      </div>
    </div>
  ) : null;
}

export default function Homepage(): any {
  return (
    <div>
      <Header />
      <div className="homepage-body">
        <Container />
      </div>
    </div>
  );
}
