import axios from "axios";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

//This is where the connection to the dynamodb is created
const client = new DynamoDBClient({
    region:"us-east-1"
});
const documentClient = DynamoDBDocumentClient.from(client);

interface Params {
    latitude: number;
    longitude: number;
    start_date: string;
    end_date: string;
    hourly: string;
}

// This is the query parameter for the ope matroo endpoint	
const params: Params = {
    "latitude": 51.6056,
    "longitude": 0.0682,
    "start_date": "2024-01-29",
    "end_date": "2024-04-12",
    "hourly": "temperature_2m"
};
const url = "https://archive-api.open-meteo.com/v1/archive";

interface Location {
    string: Array<Number>
}

const locationList: Array<String> = ["London", "Manchester", "Liverpool", "Chelsea", "Tottenham"]
const locationGeoList: any = { "London": [51.5072, 13.41], "Manchester": [53.4808, 2.2426], "Liverpool": [53.4084, 2.9916], "Chelsea": [2.9916, 0.1700], "Tottenham": [51.6056, 0.0682] }

// This uploads weather data gotten from the open-meteo api to the dynamo db
async function uploadingLocationWeather() {
    try {
        const url = "https://archive-api.open-meteo.com/v1/archive";
        const responses = await axios.get(url, { params });
        const response: any = responses.data.hourly;
        for (let j = 0; j < 500; j++) {
            //This inputs the value of each feature into the weather table on dynamodb
            const command = new PutCommand({
                TableName: "Weather",
                Item: { 
                    Location: "Tottenham",
                    TimeStamp: response["time"][j],
                    LocationValue:response["temperature_2m"][j],

                },
            });
            //Store data in DynamoDB and handle errors
            // console.log()
            // console.log(response["temperature_2m"][j])
            try {
                const response = await documentClient.send(command);
                console.log(response);
            } catch (err) {
                console.log(err);
            }

        }
    } catch (ex: any) {
        if (ex.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log("Response data:", ex.response.data);
            // console.log()
            console.log("Response status:", ex.response.status);
            console.log("Response headers:", ex.response.headers);
        } else if (ex.request) {
            // The request was made but no response was received
            console.log("Request data:", ex.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error message:", ex.message);
        }
    }
}

//The upload weather function is called
uploadingLocationWeather();