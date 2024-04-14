import axios from "axios";
import dotenv from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

//This is where the connection to the dynamodb is created
const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

//This handles the apiKey encryption
dotenv.config();
const apiKey ="a03919360fc04c929ad5567efb88bc0b";
// const apiKey = process.env.NEWS_API_KEY;

/**This is the interface for the news table */
export interface NewsEntry {
    feature: string;
    description: string;
    publishedAt: string;
}

/**This is the list of weather feautures */
let location_list: Array<string> = [
    "London", "Manchester", "Liverpool", "Chelsea", "Tottenham",
];

/**This function is to get the news from the spi and push it to the aws server */
async function getLocationNews(feature: String) {
    console.log("API Key:", apiKey);
    try {
        //The urls were changed for each feature
        const url = `https://newsapi.org/v2/everything?q=global%warming%20in%20${feature}%20&sortBy=publishedAt&apiKey=${apiKey}`;
        const responses = await axios.get(url);
        const response: Array<NewsEntry> = responses.data["articles"];
        for (var i = 0; i < (response.length < 12 ? response.length : 12); i++) {
            const command = new PutCommand({
                TableName: "NewsTable",
                Item: {
                    Location: feature,
                    TimeStamp: response[i].publishedAt,
                    News: response[i].description,
                },
            });
            //Store data in DynamoDB and handle errors
            try {
                const response = await documentClient.send(command);
                console.log(response);
            } catch (err) {
                console.error("ERROR uploading data: " + JSON.stringify(err));
            }
        }
    } catch (ex: any) {
        if (ex.response) {
            console.log("Response data:", ex.response.data);
        } else if (ex.request) {
            // The request was made but no response was received
            console.log("Request data:", ex.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error message:", ex.message);
        }
    }
}

for (var i = 0; i < location_list.length; i++) {
    getLocationNews(location_list[i]);

}