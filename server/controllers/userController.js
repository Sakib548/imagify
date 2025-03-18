import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import transactionModel from "../models/transactionModel.js";
import userModel from "../models/userModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({ success: true, token, user: { name: user.name } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: "User" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      res.json({ success: true, token, user: { name: user.name } });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const userCredits = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);

    res.status(200).json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const paymentStripe = async (req, res) => {
  try {
    const { userId, planId } = req.body;
    const userData = await userModel.findById(userId);
    const { origin } = req.headers;
    if (!userId || !planId) {
      res.status(400).json({ success: false, message: "Missing Details" });
    }

    let credits, plan, amount, date;

    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;

      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        break;

      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;
      default:
        return res.json({ success: false, message: "plan not found" });
    }

    date = Date.now();
    const transactionData = {
      userId,
      plan,
      amount,
      credits,
      date,
    };

    //console.log("Transaction", transactionData);

    const newOrder = new transactionModel(transactionData);
    await newOrder.save();

    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newOrder._id,
    };

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}&credits=${newOrder.credits}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}&credits=${newOrder.credits}`,

      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: process.env.CURRENCY,
            product_data: {
              name: planId, // Add plan name
            },
            unit_amount: amount * 100, // Stripe expects the amount in the smallest currency unit (e.g., cents)
          },
          quantity: 1, // Quantity of the plan being purchased
        },
      ],
      // metadata: {
      //   userId: userId,
      //   orderId: newOrder._id, // Save order ID
      //   plan: plan,
      //   credits: credits,
      //   date: date,
      // },
    });
    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const verifyStripe = async (req, res) => {
  const { orderId, success, userId, credits } = req.body;
  console.log("credits", credits);

  try {
    if (success === "true") {
      await transactionModel.findByIdAndUpdate(orderId, { payment: true });
      let user = await userModel.findById(userId);
      console.log("CreditBalance", user.creditBalance);

      user = await userModel.findByIdAndUpdate(userId, {
        creditBalance: Number(user.creditBalance) + Number(credits),
      });
      res.status(200).json({ success: true });
    } else {
      await transactionModel.findByIdAndDelete(user._id);
      res.status(500).json({ success: false });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, message: error.message });
  }
};
