require("dotenv").config();
const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const cors = require("cors");

const app = express();
const PORT = 3000;
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const assets = [
    { id: 1, name: "Track Section A", status: "Available" },
    { id: 2, name: "Signal System B", status: "Under Maintenance" },
    { id: 3, name: "Track Section C", status: "Available" }
];

let maintenanceRequests = [];
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.send("Railway AI Backend is Running!");
});

app.get("/api/assets", (req, res) => {
    res.json({
        success: true,
        message: "Railway Assets Data",
        assets: assets
    });
});

app.post("/api/maintenance", (req, res) => {
    const request = {
        id: Date.now(),
        ...req.body,
        status: "Pending"
    };

    maintenanceRequests.push(request);

    res.status(201).json({
        success: true,
        message: "Maintenance request saved successfully",
        request: request
    });
});

app.get("/api/maintenance", (req, res) => {
    res.json({
        success: true,
        requests: maintenanceRequests
    });
});
app.post("/api/ai-suggestions", async (req, res) => {
    const prompt = `
You are an expert Railway Maintenance AI Assistant.

Railway Assets:
${JSON.stringify(assets)}

Maintenance Requests:
${JSON.stringify(maintenanceRequests)}

Analyse the data and provide:

1. Maintenance risk analysis.
2. High priority maintenance recommendations.
3. Possible scheduling conflicts.
4. Asset safety recommendations.
5. Suggestions to reduce railway downtime.

Give practical recommendations in simple English.
`;

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Gemini AI attempt ${attempt}`);

            const response = await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: prompt
            });

            return res.json({
                success: true,
                suggestions: response.text
            });

        } catch (error) {
            const status = Number(error.status || error.statusCode || 0);

            console.error("Gemini AI Error:", error.message);

            if (![429, 500, 502, 503, 504].includes(status)) {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }

            if (attempt === maxAttempts) {
                return res.status(status).json({
                    success: false,
                    message: "Gemini AI is temporarily unavailable. Please try again later.",
                    error: error.message
                });
            }

            const delay = 1500 * Math.pow(2, attempt - 1);

            console.log(`Retrying after ${delay} ms`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
