import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios";
import moment from 'moment-timezone'

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

async function lookupTime(location) {
  const res = await axios.get(
    `http://worldtimeapi.org/api/timezone/${location}`
  );
  const { datetime } = res.data;
  let time = moment.tz(datetime, location).format('h:mmA')
  console.log(`El tiempo actual en ${location} es ${time}`);
}

async function main() {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Que hora es actualmente en España?" },
    ],
    functions: [
      {
        name: "lookupTime",
        description: "Look up the current time in a given location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description:
                'La ubicacion de la cual se quiere saber la hora actual. Ejemplo: "Bogota". Pero debe estar escrigo con el nombre del timezone por ejemplo: Asia/Shangai, America/Bogota, Europe/Madrid, etc.',
            },
          },
          required: ["location"],
        },
      },
    ],
    function_call: "auto",
  });

  const completionResponse = completion.choices[0].message;

  if (!completionResponse.content) {
    const functionCallName = completionResponse.function_call.name;
    console.log(`Funcion llamada: ${functionCallName}`);

    if (functionCallName === "lookupTime") {
      const args = JSON.parse(completionResponse.function_call.arguments);
      console.log(arguments);
      lookupTime(args.location);
    }
  }
}

main();
