const https = require("https");
const fs = require("fs");

const CHANNEL_ACCESS_TOKEN = "Zy8Vle0eMsmoSXIchLk4+upFfR9iWrYGKezHg4yoKjm8NzmO2GRkr7++x5R5/P2uXP4cJJ9KHNWuPj0c7okT5JQbdIpKlGbfIMXDXCDQW+v5aVBKWdxGr8pL8LvdKfWafC/uEBHKDHap6/RfnRryjAdB04t89/1O/w1cDnyilFU=";

// ======================
// STEP 1: CREATE RICH MENU
// ======================

const richmenu = JSON.stringify({
  size: {
    width: 2500,
    height: 1686
  },
  selected: true,
  name: "Gomi Menu",
  chatBarText: "เมนู",
  areas: [

    // ช่อง 2
    {
      bounds: { x: 833, y: 0, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: "https://gomi-wet.web.app/home.html"
      }
    },

    // ช่อง 3
    {
      bounds: { x: 1666, y: 0, width: 834, height: 843 },
      action: {
        type: "uri",
        uri: "https://gomi-wet.web.app/status.html"
      }
    },

    // ช่อง 4
    {
      bounds: { x: 0, y: 843, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: "https://gomi-wet.web.app/register.html"
      }
    },

    // ช่อง 5
    {
      bounds: { x: 833, y: 843, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: "https://gomi-wet.web.app/calculate.html"
      }
    },

    // ช่อง 6 FAQ → ส่งข้อความ "งงจ้า"
    {
      bounds: { x: 1666, y: 843, width: 834, height: 843 },
      action: {
        type: "message",
        text: "งงจ้า"
      }
    }

  ]
});



const createMenu = () => {

  const options = {
    hostname: "api.line.me",
    path: "/v2/bot/richmenu",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(richmenu)
    }
  };


  const req = https.request(options, res => {

    let data = "";

    res.on("data", chunk => data += chunk);

    res.on("end", () => {

      console.log("CREATE:", data);

      const richMenuId = JSON.parse(data).richMenuId;

      uploadImage(richMenuId);

    });

  });

  req.write(richmenu);
  req.end();

};



// ======================
// STEP 2: UPLOAD IMAGE
// ======================

const uploadImage = (richMenuId) => {

  const image = fs.readFileSync("richmenu.png");


  const options = {

    hostname: "api-data.line.me",

    path: `/v2/bot/richmenu/${richMenuId}/content`,

    method: "POST",

    headers: {

      "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`,

      "Content-Type": "image/png",

      "Content-Length": image.length

    }

  };


  const req = https.request(options, res => {

    console.log("UPLOAD STATUS:", res.statusCode);

    setDefault(richMenuId);

  });


  req.write(image);

  req.end();

};




// ======================
// STEP 3: SET DEFAULT
// ======================

const setDefault = (richMenuId) => {


  const options = {

    hostname: "api.line.me",

    path: `/v2/bot/user/all/richmenu/${richMenuId}`,

    method: "POST",

    headers: {

      "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`

    }

  };


  const req = https.request(options, res => {

    console.log("SET DEFAULT:", res.statusCode);

  });


  req.end();

};



createMenu();
