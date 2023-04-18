const express = require('express')
const router = express.Router()
const axios = require('axios');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const PROJECT_ID = process.env.PROJECT_ID
const DATASET = process.env.DATASET

//stripe session checkout function
router.post("/session", async (req, res) => {
    const items = req.body;
    console.log(items);
    const allProducts = await Promise.all(
        items.map(async (item) => {

            const { data } = await axios.get(`https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=${`*[_type == "product" ][_id == "${item.id}"]
            {_id,name,"category": category[0]->.category,
             "price":filtering[${item.filter_index}].price[0].new}`}`)

            const product = data.result[0]

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `${product.name} ${item.type[0] + item.type[1]} (${item.color})`,
                        images: [item.img],
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: item.quantity,
            };
        })
    )

    const session = await stripe.checkout.sessions.create({
        line_items: allProducts,
        phone_number_collection: {
            enabled: true,
        },
        mode: 'payment',
        success_url: process.env.MY_APP_URL + "?success=true",
        cancel_url: process.env.MY_APP_URL + "?canceled=true",
    });
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-type,Accept,X-Custom-Header");
    res.status(200).send({ url: session.url })
});

router.get("/", async (req, res) => {
    res.json({
        status:200,
        message: "get data successfully"
    })
})

module.exports = router