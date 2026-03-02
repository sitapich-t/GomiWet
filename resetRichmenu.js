const https = require("https");

const CHANNEL_ACCESS_TOKEN = "Zy8Vle0eMsmoSXIchLk4+upFfR9iWrYGKezHg4yoKjm8NzmO2GRkr7++x5R5/P2uXP4cJJ9KHNWuPj0c7okT5JQbdIpKlGbfIMXDXCDQW+v5aVBKWdxGr8pL8LvdKfWafC/uEBHKDHap6/RfnRryjAdB04t89/1O/w1cDnyilFU=";

const options = {
  hostname: "api.line.me",
  path: "/v2/bot/user/all/richmenu",
  method: "DELETE",
  headers: {
    "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
};

const req = https.request(options, (res) => {

  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {

    console.log("Status:", res.statusCode);
    console.log("Response:", data);

  });

});

req.on("error", (error) => {
  console.error(error);
});

req.end();
