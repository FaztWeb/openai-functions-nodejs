import OpenAI from "openai";
import axios from "axios";
import moment from "moment-timezone";
import dotenv from "dotenv";

dotenv.config();

// set up the OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Define a function called lookupTime that takes a location as a parameter and returns the current time in that location.
// The function makes a GET request to the World Time API, extracts the current time from the response, and formats it.
async function lookupTime(location) {
  try {
    const response = await axios.get(
      `http://worldtimeapi.org/api/timezone/${location}`
    ); // Make a GET request to the World Time API with the location parameter as the timezone.
    const { datetime } = response.data; // Extract the datetime property from the data in the response.
    const dateTime = moment.tz(datetime, location).format("h:mmA"); // Use moment-timezone to create the Date object in the specified timezone.
    console.log(`The current time in ${location} is ${dateTime}.`); // Log the formatted time to the console.
  } catch (error) {
    console.error(error); // Log any errors that occur to the console.
  }
}

async function main() {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What time is it in Beijing, China?" },
    ],
    functions: [
      {
        name: "lookupTime",
        description: "get the current time in a given location",
        parameters: {
          type: "object", // specify that the parameter is an object
          properties: {
            location: {
              type: "string", // specify the parameter type as a string
              description:
                "The location, e.g. Beijing, China. But it should be written in a timezone name like Asia/Shanghai",
            },
          },
          required: ["location"], // specify that the location parameter is required
        },
      },
    ],
    function_call: "auto",
  });

  // Extract the generated completion from the OpenAI API response.
  const completionResponse = completion.data.choices[0].message;
  console.log(completionResponse);

  if (!completionResponse.content) {
    const functionCallName = completionResponse.function_call.name;
    console.log("functionCallName: ", functionCallName);

    if (functionCallName === "lookupTime") {
      const completionArguments = JSON.parse(
        completionResponse.function_call.arguments
      );
      console.log("completionArguments: ", completionArguments);

      lookupTime(completionArguments.location);
    }
  }
}
main();
