import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });
const documentClient = DynamoDBDocumentClient.from(client);

//export const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({region: "eu-west-1"}));

export const lambdaHandler = async (event) => {
    if (!event.body) {
        const status = addStatus(500);
        console.log(status);
        return status;
    }
    let body = {};
    try {
        body = Array.of(JSON.parse(event.body));
    } catch (error) {
        console.log("Errore JSON non valido");
    }
    console.log(body)
    let response = (body || []).map((record) => addProduct(record));
    console.log(response)
    let results = await Promise.allSettled(response);
    console.log(results)
    let batchItemFailures = results.filter(item => item.status === 'rejected')
    console.log(batchItemFailures)
    if (body && batchItemFailures.length === 0) {
        const status = addStatus(200);
        console.log(status);
        return status;
    }
    else {
        const status = addStatus(400);
        console.log(status);
        return status;
    }
};

async function addProduct(product) {
    const params = {
        TableName: "ProductsDB",
        Key: {
            PK: product.PK,
            SK: product.SK,
        },
        UpdateExpression: "set Marca = :marca, Taglia = :taglia, Prezzo = :prezzo",
        ExpressionAttributeValues: {
            ":marca": product.marca,
            ":taglia": product.taglia,
            ":prezzo": product.prezzo,
        },
        ReturnValues: "ALL_NEW",
    }
    const newCommand = new UpdateCommand(params);
    const response = await documentClient.send(newCommand);
    return response;
}

function addStatus(number) {
    return {
        statusCode: number,
        headers: {
            'Content-Type': 'application/json,'
        },
        body: number
    }
}