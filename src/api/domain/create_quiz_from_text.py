from openai import OpenAI


def create_quiz(text: str, amount: int = 10):

    prompt = text + """\n Com base no texto fornecido, crie um questionário de {} perguntas e respostas.
    Não use fontes externas, baseie-se inteiramente no texto. Suponha que você é um professor tendo
    que utilizar um livro-texto como referência pra construir uma prova.

    Ao final do processo, retorne a lista de perguntas e respostas em um json.
    O json deve ser da seguinte forma, uma chave com 'Pergunta %', onde % é o índice da pergunta, e o valor sendo outro dict sendo
    a chave a pergunta gerada e o valor a respectiva resposta.
    """.format(amount)


    client = OpenAI(api_key='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')

    chat_completion = client.chat.completions.create(messages=[
        {
            'role': 'user',
            'content': prompt,
        }], model='gpt-3.5-turbo')
    

    return chat_completion.choices[0].message.content