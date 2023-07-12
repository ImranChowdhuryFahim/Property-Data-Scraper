import express, { Request, Response } from 'express';
import route from './routes';

const app = express();

app.use(route);
app.use('/', (req: Request, res: Response) => { res.status(200).json({ message: 'hello from aws-nodejs-lambda : github actions : EC2' }) });


export default app;