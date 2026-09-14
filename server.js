const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const app = express();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Razorpay UPI server running"
  });
});


/* ==============================
   CREATE ₹1 ORDER
================================ */

app.post("/create-order", async (req, res) => {

  try {

    const order = await razorpay.orders.create({
      amount: 100,
      currency: "INR",
      receipt: "test_" + Date.now()
    });

    res.json({
      success: true,
      order: order
    });

  } catch (error) {

    console.error("CREATE ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


/* ==============================
   VERIFY PAYMENT
================================ */

app.post("/verify-payment", (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });

    }

    res.json({
      success: true,
      message: "Payment verified",
      payment_id: razorpay_payment_id
    });

  } catch (error) {

    console.error("VERIFY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
