const Order = require("../Orders/model");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/AppError");

exports.createPayment = catchAsync(async (req, res, next) => {
  const headers = new Headers();
  headers.append("Authorization", "Token egy_sk_test_3f207a19ff18c5a2a41b780c34557b371a80466f55e6c9a6d4424fa5aa9bcc96");
  headers.append("Content-Type", "application/json");
  const products = req.body.products.map((product) => {
    return {
      name: product.name,
      amount: product.price * 100,
      description: "Item description",
      quantity: product.quantity,
    };
  });
  const data = { products: products, total: req.body.total };
  const body = {
    amount: Number(data.total) * 100,
    currency: "EGP",
    payment_methods: [4933362],
    items: data.products,
    billing_data: {
      apartment: "dumy",
      first_name: "ala",
      last_name: "zain",
      street: "dumy",
      building: "dumy",
      phone_number: "+92345xxxxxxxx",
      city: "dumy",
      country: "dumy",
      email: "ali@gmail.com",
      floor: "dumy",
      state: "dumy",
    },
    extras: {
      ee: 22,
    },
    special_reference: Date.now(),
    expiration: 3600,
    notification_url: "https://webhook.site/dabe4968-5xxxxxxxxxxxxxxxxxxxxxx",
    redirection_url: `https://mctasuvendingmachine.vercel.app/api/payments/finish-payment/${req.body.orderId}`,
  };
  products.forEach((product) => {
    console.log(product.amount);
  });
  console.log(body.amount);
  const requestOptions = {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    redirect: "follow",
  };
  let client_secret = "";
  const request = await fetch("https://accept.paymob.com/v1/intention/", requestOptions);
  const response = await request.json();
  client_secret = response.client_secret;
  console.log(response);
  if (!client_secret) {
    return next(new AppError("Failed to create payment intention", 500));
  }
  const pay_url = `https://accept.paymob.com/unifiedcheckout/?publicKey=egy_pk_test_pR1T8M2JTWS1Udcig4WjcEDFpgNmPdGA%26clientSecret=${client_secret}`;
  qr_url = `https://api.qrserver.com/v1/create-qr-code/?data=${pay_url}&size=200x200`;
  res.status(200).json({
    status: "success",
    data: {
      qr_url,
    },
  });
});

exports.finishPayment = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus === "Paid") {
    res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Not Found</title>
      <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        margin-top: 50px;
      }
      h1 {
        color: red;
      }
      p {
        font-size: 18px;
      }
      </style>
    </head>
    <body>
      <h1>Invalid Request</h1>
      <p>The request you are trying to send is invalid. Please refresh the page.</p>
      <p>After refreshing, if the problem is not solved please contact support.</p>
      <code>Requested Order ID: ${orderId}</code>
    </body>
    </html>
    `);
  }
  order.paymentStatus = "Paid";
  await order.save();
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin-top: 50px;
        }
        h1 {
          color: green;
        }
        p {
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <h1>Payment Successful</h1>
      <p>Thank you for your payment. Your order has been successfully processed. Please proceed to machine to get your snacks!</p>
    </body>
    </html>
  `);
});
