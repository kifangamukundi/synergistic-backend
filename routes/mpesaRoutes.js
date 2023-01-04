import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import axios from 'axios';
import Transaction from '../models/paymentModel.js';

const mpesaRouter = express.Router();

//STEP 1 getting access token

const getAccessToken = async (req, res, next) => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const auth = new Buffer.from(`${key}:${secret}`).toString("base64");
  
    try {
      const result = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            authorization: `Basic ${auth}`,
          },
        }
      );
    
    req.token = result.data.access_token;
    next();
    } catch (err) {
      return res.status(401).send({ error: err.message });
    }
  };
  
  //STEP 2 //stk push
  mpesaRouter.post("/stk", getAccessToken, expressAsyncHandler(async (req, res) => {
    const phone = req.body.phone.substring(1); //formated to 72190........
    const amount = req.body.amount;
  
    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);
    const shortCode = process.env.MPESA_PAYBILL;
    const passkey = process.env.MPESA_PASSKEY;
  
    const callbackurl = process.env.CALLBACK_URL;
  
    const password = new Buffer.from(shortCode + passkey + timestamp).toString(
      "base64"
    );
    
    const token = req.token;

    try {
      const result = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: `254${phone}`,
          PartyB: shortCode,
          PhoneNumber: `254${phone}`,
          CallBackURL: `${callbackurl}/${process.env.CALLBACK_ROUTE}`,
          AccountReference: `254${phone}`,
          TransactionDesc: "Test",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    
    res.json(result.data);
      
    } catch (err) {
      return res.status(401).send({ error: err.message });
    }
      
  }));
  
  //STEP 3 callback url
  const callback_route = process.env.CALLBACK_ROUTE;
  mpesaRouter.post(`/${callback_route}`, expressAsyncHandler(async(req, res) => {
    if (!req.body.Body.stkCallback.CallbackMetadata) {
      console.log(req.body.Body.stkCallback.ResultDesc);
      res.status(200).json("ok");
      return;
    }
  
    const amount = req.body.Body.stkCallback.CallbackMetadata.Item[0].Value;
    const code = req.body.Body.stkCallback.CallbackMetadata.Item[1].Value;
    const phone1 =
      req.body.Body.stkCallback.CallbackMetadata.Item[4].Value.toString().substring(
        3
      );
    const phone = `0${phone1}`;

    try {
     const transaction = new Transaction({
      customer_number: phone,
      mpesa_ref: code,
      amount: amount
     });
    const payment = await transaction.save();
    res.send({ message: 'Payment Proceeded', payment });
    } catch (err) {
      return res.status(401).send({ error: err.message });
    }
  
    res.status(200).json("ok");
  }));
  
  mpesaRouter.post("/stkpushquery", getAccessToken, expressAsyncHandler(async (req, res) => {
    const CheckoutRequestID = req.body.CheckoutRequestID;
  
    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);
    const shortCode = process.env.MPESA_PAYBILL;
    const passkey = process.env.MPESA_PASSKEY;
  
    const password = new Buffer.from(shortCode + passkey + timestamp).toString(
      "base64"
    );
    
    const token = req.token;

      try {
        const result = await axios.post(
          "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
          {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: CheckoutRequestID,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        res.status(200).json(result.data);
      } catch (err) {
        return res.status(400).send({ error: err.message });
      }
  }));
  
  mpesaRouter.get("/transactions", (req, res) => {
    Transaction.find({})
      .sort({ createdAt: -1 })
      .exec(function (err, data) {
        if (err) {
          res.status(400).json(err.message);
        } else {
          res.status(201).json(data);
          // data.forEach((transaction) => {
          //   const firstFour = transaction.customer_number.substring(0, 4);
          //   const lastTwo = transaction.customer_number.slice(-2);
  
          //   console.log(`${firstFour}xxxx${lastTwo}`);
          // });
        }
      });
  });

  export default mpesaRouter;