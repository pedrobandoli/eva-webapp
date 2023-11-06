function processQA(pergunta: string, resposta: string) {
    return `<switch var='$'>
    <talk> ${pergunta} </talk>
    <listen/>
    <case op='exact' value='${resposta}'>
        <useMacro macro='RIGHT_ANSWER'/>
    </case>
    <default>
        <useMacro macro='WRONG_ANSWER'/>
    </default>
</switch>`
}


function processQuizXML(questionario: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <evaml
      name="evaml-task-completed"
      xsi:noNamespaceSchemaLocation="EvaML-Schema/evaml_schema.xsd"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <settings>
        <voice tone="pt-BR_IsabelaV3Voice" />
        <lightEffects mode="ON" />
        <audioEffects mode="ON" />
      </settings>
      <script>
        <counter var="PONTOS" op="=" value="0" />
        <useMacro macro='START'/>
        ${questionario}
        <useMacro macro="SCORE_FINAL"/>
  </script>
  <macros>
    <macro id="START">
      <evaEmotion emotion="HAPPY" />
      <light state="ON" color="PINK"/>
      <talk>Olá, eu sou a robô EVA. Qual o seu nome? </talk>
      <listen/>
      <talk> Olá $. Vamos jogar perguntas e respostas! </talk>
    </macro>
    <macro id="RIGHT_ANSWER">
      <evaEmotion emotion="HAPPY" />
      <counter var="PONTOS" op="+" value="1" />
      <audio source="mario-start-02" block="TRUE" />
      <talk>Muito bem! Você acertou!</talk>
    </macro>
    <macro id="WRONG_ANSWER">
      <motion type="NO" />
      <evaEmotion emotion="SAD" />
      <light state="ON" color="BLUE"/>
      <talk>Poxa, você errou. Mas sempre pode tentar novamente!</talk>
    </macro>
    <macro id='SCORE_FINAL'>
        <evaEmotion emotion="HAPPY" />
        <light state="ON" color="PINK"/>
        <motion type="CENTER" />
        <switch var="PONTOS">
            <case op="eq" value="0">
                <talk>Foi muito bom jogar com você</talk>
                <talk>Mas você precisa praticar mais!</talk>
                <talk>Bons estudos e até mais</talk>
            </case>
            <case op="gte" value="0">
                <talk>Meus parabéns, você acertou #PONTOS perguntas</talk>
                <talk>Foi muito bom jogar com você. Até mais</talk>
            </case>
            </switch>
        </macro>
    </macros>
    </evaml>
        `
}

export function createQuizXML(questionario: any){
    let questionarioXMLStr = ''

    Object.entries(questionario).map(([id, qa]) => {
        Object.entries(qa as any).map(([pergunta, resposta]) => {
            questionarioXMLStr += processQA(pergunta, resposta as string);
        })
    })

    return processQuizXML(questionarioXMLStr);
}