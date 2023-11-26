export interface QA {
  question: string;
  answer: string;
}

export type ContainerTypes = "inicial" | "quiz" | "jsonGen";
export type Quiz = { idAnswer: QA };