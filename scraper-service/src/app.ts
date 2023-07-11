import express, { Request, Response } from 'express';
import serverless from 'serverless-http';

const app = express();

app.use('/', (req: Request, res: Response) => { res.status(200).json({ message: 'hello from aws-nodejs-lambda : github actions' }) });


export default app;
export const handler = serverless(app);