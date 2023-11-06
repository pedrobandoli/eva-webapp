import axios from 'axios'; 

// const API_KEY = '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';
const API_KEY = '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';


export default async function gerarQuiz({ tema, nivel, quantidade}: {tema: string, nivel: string, quantidade: number}) {
const apiKey = API_KEY;

// Define o prompt para gerar as perguntas e respostas
const prompt = "Suponha que você é um professor de história do ensino fundamental. Gere uma lista de 10 perguntas de nível de dificuldade médio, juntamente com suas respostas (que devem conter apenas uma única palavra).";

const requestData = {
  prompt,
  max_tokens: 100,  // Ajuste conforme necessário
  n: 10  // Número de perguntas que você deseja gerar
};

axios({
  method: 'post',
  url: 'https://api.openai.com/v1/engines/davinci/completions',
  data: requestData,
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
})
  .then((response: any) => {
    const questionsAndAnswers = response.data.choices[0].text.trim().split('\n');
    const questions = questionsAndAnswers.slice(0, questionsAndAnswers.length / 2);
    const answers = questionsAndAnswers.slice(questionsAndAnswers.length / 2);

    const questionAnswerDict: any = {};
    questions.forEach((question: string, index: string | number) => {
      questionAnswerDict[question.trim()] = answers[index].trim();
    });

    console.log(questionAnswerDict);
  })
  .catch((error: any) => {
    console.error('Erro na solicitação:', error);
  });

}