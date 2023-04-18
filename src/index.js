const express = require('express')
const server = express()
const cors = require('cors')
const axios = require('axios');
require('dotenv').config()



const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.PROJECT_ID
const DATASET = process.env.DATASET
server.use(express.static("public"))
server.use(express.json())
server.use(cors({
    credentials: true,
    preflightContinue: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: true
}))
server.options('*', cors())
server.use(express.urlencoded({ extended: true }))



//stripe session checkout function
server.post("/create-payment-session", async (req, res) => {
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


server.listen(PORT, () => {
    console.log(`Server running at Port: ${PORT}...`);
})

module.exports = server;

